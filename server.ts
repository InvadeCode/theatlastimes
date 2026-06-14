import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Parser from "rss-parser";
import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

// Data
import { mockArticles, mockBriefings } from "./src/lib/mockData";
import { generateFallbackArticles } from "./src/lib/generateMockData";
import { Article } from "./src/types";
import { requireAuth } from "./src/middleware/auth.js";

// DB
import { db as drizzleDb } from "./src/db/index.js";
import { sourceItems, publishedContent } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit as fsLimit,
  where,
} from "firebase/firestore";

// Load Firebase Config directly
import fs from "fs";
let firebaseConfigStr = "{}";
try {
  firebaseConfigStr = fs.readFileSync(
    path.join(process.cwd(), "firebase-applet-config.json"),
    "utf8",
  );
} catch (e) {}
const firebaseConfig = JSON.parse(firebaseConfigStr);

const firebaseApp = initializeApp(firebaseConfig);
const firebaseDb = getFirestore(
  firebaseApp,
  firebaseConfig.firestoreDatabaseId || "(default)",
);

let geminiClient: GoogleGenAI | null = null;
function getGemini() {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn(
        "GEMINI_API_KEY is not set. AI features might be degraded or mocked.",
      );
      return null;
    }
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

const parser = new Parser({
  customFields: {
    item: ["media:content", "media:group", "content:encoded"],
  },
});
const FEED_URLS = [
  "https://news.google.com/rss/search?q=geopolitics+OR+defense+OR+trade+when:7d&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=world+economy+OR+markets+when:7d&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=technology+policy+OR+AI+regulation+when:7d&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=global+climate+change+OR+energy+transition+when:7d&hl=en-US&gl=US&ceid=US:en",
  "https://news.google.com/rss/search?q=cyber+security+OR+elections+when:7d&hl=en-US&gl=US&ceid=US:en",
];

const CURATED_IMAGES = {
  Economy: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/MAERSK_MC_KINNEY_M%C3%96LLER_%26_MARSEILLE_MAERSK_%2848694054418%29.jpg/960px-MAERSK_MC_KINNEY_M%C3%96LLER_%26_MARSEILLE_MAERSK_%2848694054418%29.jpg",
      credit: "Kees Torn",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/New_York_Stock_Exchange_Facade_2015.jpg/960px-New_York_Stock_Exchange_Facade_2015.jpg",
      credit: "Ryan Lawler",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Photos_NewYork1_032.jpg/960px-Photos_NewYork1_032.jpg",
      credit: "Ralf Roletschek",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Map_of_countries_by_GDP_%28PPP%29_per_capita_in_2024.svg/960px-Map_of_countries_by_GDP_%28PPP%29_per_capita_in_2024.svg.png",
      credit: "Public Domain",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/2/24/Kaufmann-1568.png",
      credit: "Jost Amman",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Euro_M%C3%BCnzgeld_und_Portmonee_mit_gr%C3%BCnem_Pfeil_%28Geld%2C_Kleingeld%2C_M%C3%BCnzen%29.jpg/960px-Euro_M%C3%BCnzgeld_und_Portmonee_mit_gr%C3%BCnem_Pfeil_%28Geld%2C_Kleingeld%2C_M%C3%BCnzen%29.jpg",
      credit: "Santeri Viinamäki",
      source: "Wikimedia Commons",
    },
  ],
  "Tech Policy": [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Aerial_photograph_of_Globalfoundries_Dresden.jpg/960px-Aerial_photograph_of_Globalfoundries_Dresden.jpg",
      credit: "Carsten Frenzl",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Capitol_Building_Full_View.jpg/960px-Capitol_Building_Full_View.jpg",
      credit: "Martin Falbisoner",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/960px-Flag_of_Europe.svg.png",
      credit: "Public Domain",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Utah_Data_Center_Panorama_%28cropped%29.jpg/960px-Utah_Data_Center_Panorama_%28cropped%29.jpg",
      credit: "EFF",
      source: "Wikimedia Commons",
    },
  ],
  Tech: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/SEG_DVD_430_-_Printed_circuit_board-4276.jpg/960px-SEG_DVD_430_-_Printed_circuit_board-4276.jpg",
      credit: "Raimond Spekking",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/NXP_PCF8577C_LCD_driver_with_I%C2%B2C_%28Colour_Corrected%29.jpg/960px-NXP_PCF8577C_LCD_driver_with_I%C2%B2C_%28Colour_Corrected%29.jpg",
      credit: "Z22",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Utah_Data_Center_Panorama_%28cropped%29.jpg/960px-Utah_Data_Center_Panorama_%28cropped%29.jpg",
      credit: "EFF",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Dampfturbine_Montage01.jpg/960px-Dampfturbine_Montage01.jpg",
      credit: "Siemens Pressebild",
      source: "Wikimedia Commons",
    },
  ],
  Technology: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/SEG_DVD_430_-_Printed_circuit_board-4276.jpg/960px-SEG_DVD_430_-_Printed_circuit_board-4276.jpg",
      credit: "Raimond Spekking",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Utah_Data_Center_Panorama_%28cropped%29.jpg/960px-Utah_Data_Center_Panorama_%28cropped%29.jpg",
      credit: "EFF",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Aerial_photograph_of_Globalfoundries_Dresden.jpg/960px-Aerial_photograph_of_Globalfoundries_Dresden.jpg",
      credit: "Carsten Frenzl",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/NXP_PCF8577C_LCD_driver_with_I%C2%B2C_%28Colour_Corrected%29.jpg/960px-NXP_PCF8577C_LCD_driver_with_I%C2%B2C_%28Colour_Corrected%29.jpg",
      credit: "Z22",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Dampfturbine_Montage01.jpg/960px-Dampfturbine_Montage01.jpg",
      credit: "Siemens Pressebild",
      source: "Wikimedia Commons",
    },
  ],
  Climate: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Andasol_Guadix_4.jpg/960px-Andasol_Guadix_4.jpg",
      credit: "Bjoern Schwarz",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Windmills_D1-D4_%28Thornton_Bank%29.jpg/960px-Windmills_D1-D4_%28Thornton_Bank%29.jpg",
      credit: "Hans Hillewaert",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Polestar_2_charging_at_Tesla_Supercharger.jpg/960px-Polestar_2_charging_at_Tesla_Supercharger.jpg",
      credit: "Kiwiev",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Change_in_Average_Temperature_With_Fahrenheit.svg/960px-Change_in_Average_Temperature_With_Fahrenheit.svg.png",
      credit: "NASA",
      source: "Wikimedia Commons",
    },
  ],
  Environment: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Andasol_Guadix_4.jpg/960px-Andasol_Guadix_4.jpg",
      credit: "Bjoern Schwarz",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Anacortes_Refinery_31911.JPG/960px-Anacortes_Refinery_31911.JPG",
      credit: "Walter",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Windmills_D1-D4_%28Thornton_Bank%29.jpg/960px-Windmills_D1-D4_%28Thornton_Bank%29.jpg",
      credit: "Hans Hillewaert",
      source: "Wikimedia Commons",
    },
  ],
  Security: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Operating_system_placement.svg/960px-Operating_system_placement.svg.png",
      credit: "Public Domain",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Utah_Data_Center_Panorama_%28cropped%29.jpg/960px-Utah_Data_Center_Panorama_%28cropped%29.jpg",
      credit: "EFF",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Capitol_Building_Full_View.jpg/960px-Capitol_Building_Full_View.jpg",
      credit: "Martin Falbisoner",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/141113-A-QS211-509_-_Soldiers_of_the_1st_Brigade_Combat_Team%2C_1st_Cavalry_Division%2C_and_2nd_Cavalry_Regiment_participate_in_the_closing_ceremony_for_Iron_Sword_2014.jpg/960px-thumbnail.jpg",
      credit: "US Army",
      source: "Wikimedia Commons",
    },
  ],
  Geopolitics: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/UN_General_Assembly_hall.jpg/960px-UN_General_Assembly_hall.jpg",
      credit: "Patrick Gruban",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/White_House_north_and_south_sides.jpg/960px-White_House_north_and_south_sides.jpg",
      credit: "Daniel Schwen",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/2025_G20_Johannesburg_summit_Family_Photo.jpg/960px-2025_G20_Johannesburg_summit_Family_Photo.jpg",
      credit: "Government of South Africa",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Forms_of_government.svg/960px-Forms_of_government.svg.png",
      credit: "Public Domain",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/24.09.2024_-_Abertura_do_Debate_Geral_da_79%C2%AA_Sess%C3%A3o_da_Assembleia_Geral_das_Na%C3%A7%C3%B5es_Unidas_%2854018866744%29.jpg/960px-24.09.2024_-_Abertura_do_Debate_Geral_da_79%C2%AA_Sess%C3%A3o_da_Assembleia_Geral_das_Na%C3%A7%C3%B5es_Unidas_%2854018866744%29.jpg",
      credit: "Palácio do Planalto",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/House_of_Commons_2010.jpg/960px-House_of_Commons_2010.jpg",
      credit: "UK Parliament",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Europa_Congres_Ridderzaal_Den_Haag._Overzicht%2C_Bestanddeelnr_902-7379.jpg/960px-Europa_Congres_Ridderzaal_Den_Haag._Overzicht%2C_Bestanddeelnr_902-7379.jpg",
      credit: "National Archives",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/1/17/Microcosm_of_London_Plate_058_-_Old_Bailey_edited.jpg",
      credit: "Rowlandson & Pugin",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Election_MG_3455.JPG/960px-Election_MG_3455.JPG",
      credit: "Rama",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Yalta_Conference_%28Churchill%2C_Roosevelt%2C_Stalin%29_%28B%26W%29.jpg/960px-Yalta_Conference_%28Churchill%2C_Roosevelt%2C_Stalin%29_%28B%26W%29.jpg",
      credit: "Public Domain",
      source: "Wikimedia Commons",
    },
  ],
  World: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/960px-Flag_of_the_United_Nations.svg.png",
      credit: "Public Domain",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/UN_General_Assembly_hall.jpg/960px-UN_General_Assembly_hall.jpg",
      credit: "Patrick Gruban",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/2025_G20_Johannesburg_summit_Family_Photo.jpg/960px-2025_G20_Johannesburg_summit_Family_Photo.jpg",
      credit: "Government of South Africa",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Yalta_Conference_%28Churchill%2C_Roosevelt%2C_Stalin%29_%28B%26W%29.jpg/960px-Yalta_Conference_%28Churchill%2C_Roosevelt%2C_Stalin%29_%28B%26W%29.jpg",
      credit: "Public Domain",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/24.09.2024_-_Abertura_do_Debate_Geral_da_79%C2%AA_Sess%C3%A3o_da_Assembleia_Geral_das_Na%C3%A7%C3%B5es_Unidas_%2854018866744%29.jpg/960px-24.09.2024_-_Abertura_do_Debate_Geral_da_79%C2%AA_Sess%C3%A3o_da_Assembleia_Geral_das_Na%C3%A7%C3%B5es_Unidas_%2854018866744%29.jpg",
      credit: "Palácio do Planalto",
      source: "Wikimedia Commons",
    },
  ],
  Finance: [
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/New_York_Stock_Exchange_Facade_2015.jpg/960px-New_York_Stock_Exchange_Facade_2015.jpg",
      credit: "Ryan Lawler",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Euro_M%C3%BCnzgeld_und_Portmonee_mit_gr%C3%BCnem_Pfeil_%28Geld%2C_Kleingeld%2C_M%C3%BCnzen%29.jpg/960px-Euro_M%C3%BCnzgeld_und_Portmonee_mit_gr%C3%BCnem_Pfeil_%28Geld%2C_Kleingeld%2C_M%C3%BCnzen%29.jpg",
      credit: "Santeri Viinamäki",
      source: "Wikimedia Commons",
    },
    {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/MAERSK_MC_KINNEY_M%C3%96LLER_%26_MARSEILLE_MAERSK_%2848694054418%29.jpg/960px-MAERSK_MC_KINNEY_M%C3%96LLER_%26_MARSEILLE_MAERSK_%2848694054418%29.jpg",
      credit: "Kees Torn",
      source: "Wikimedia Commons",
    },
  ],
};

function getStableImage(str: string, category: string = "Editorial") {
  const allImages = Object.values(CURATED_IMAGES).flat();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i) + i * 17) | 0;
  }
  const idx = Math.abs(hash) % allImages.length;
  // Use a relevant image if possible by category
  let list = (CURATED_IMAGES as any)[category];
  if (!list || list.length === 0) list = allImages;
  const catIdx = Math.abs(hash) % list.length;
  return list[catIdx].url;
}

function assignImageFields(
  title: string,
  category: string,
  forceGraphic: boolean = false,
) {
  let shouldUseDataGraphic = forceGraphic;
  const lowerCat = category.toLowerCase();

  // We want most articles to have an actual image instead of data graphic.
  // 60% chance of data graphic, 40% Wikimedia Commons
  if (
    !forceGraphic &&
    (title.includes("Announces") ||
      title.includes("Launch") ||
      title.includes("Resigns") ||
      title.includes("Crash") ||
      title.includes("Attack") ||
      title.includes("Strike") ||
      title.includes("Election") ||
      title.includes("Court"))
  ) {
    shouldUseDataGraphic = false;
  } else if (!forceGraphic) {
    if (Math.random() > 0.4) shouldUseDataGraphic = true;
  }

  if (shouldUseDataGraphic) {
    return {
      imageUrl: getStableImage(title, category),
      imageType: "branded_data_visual",
      imageSource: "Atlas Intelligence",
      imageCredit: "Generated Graphic",
      imageCaption: `Editorial visual representing ${category} movements.`,
    };
  } else {
    // Pool images across categories if a specific list is empty or short,
    // but prefer the category list. To avoid duplicates, we use a single
    // global flattened pool when rendering mocked data grids
    const allImages = Object.values(CURATED_IMAGES).flat();

    let list =
      (CURATED_IMAGES as any)[category] ||
      (CURATED_IMAGES as any)["Geopolitics"];

    // If the title contains certain keywords, prefer the entire pool for variety
    // otherwise modulo math on a very small array (e.g. 3) causes frequent identical repeats
    if (list.length < 5) {
      list = [...list, ...allImages];
    }

    if (list && list.length > 0) {
      let hash = 0;
      for (let i = 0; i < title.length; i++) {
        hash = ((hash << 5) - hash + title.charCodeAt(i) + i * 17) | 0;
      }
      const idx = Math.abs(hash) % list.length;
      const img = list[idx] || list[0];
      return {
        imageUrl: img.url,
        imageType: "licensed_editorial",
        imageSource: img.source,
        imageCredit: img.credit,
        imageCaption: `File photo representing ${category}.`,
      };
    }
  }

  return {
    imageUrl: getStableImage(title, category),
    imageType: "branded_data_visual",
    imageSource: "Atlas Intelligence",
    imageCredit: "Generated Graphic",
    imageCaption: `Fallback visual.`,
  };
}

// Track processed URLs to prevent duplicate scraping in memory
const processedUrls = new Set<string>();

async function syncMocksToFirebase() {
  try {
    const snap = await getDocs(
      query(collection(firebaseDb, "articles"), fsLimit(1))
    );
    if (snap.empty) {
      console.log(
        "Firebase 'articles' collection is empty. Seeding mock & fallback data...",
      );
      const seeded = [...mockArticles, ...generateFallbackArticles(100)].map(
        (a, i) => {
          return {
            ...a,
            ...assignImageFields(a.title + i.toString(), a.category),
            fullContent:
              a.fullContent ||
              `<p>The unfolding situation regarding <strong>${a.title}</strong> has significant implications across multiple sectors. Early intelligence suggests a pivot in fundamental strategies, echoing past historical volatility.</p><p>Regional experts emphasize caution. According to preliminary analysis: <em>"${a.aiSummary}"</em></p><p>As markets and political entities react, supply chain logistics and diplomatic channels are expected to experience moderate interruptions. The long-term resonance of this event remains categorized as actively evolving.</p><p>Additional operational updates will be broadcast as further verified data points are processed through the Global Syndicate intelligence apparatus.</p>`,
          };
        },
      );
      for (const article of seeded) {
        await setDoc(doc(firebaseDb, "articles", article.id), article);
      }
      console.log("Seeded " + seeded.length + " articles to Firebase.");
    }
  } catch (e) {
    console.error("Failed to seed Firebase:", e);
  }
}
if (process.env.NODE_ENV !== "production") {
  syncMocksToFirebase();
}

let fetchImageCounter = 0;
async function pollRSSFeeds() {
  console.log("Polling RSS feeds for live intelligence...");
  for (const url of FEED_URLS) {
    try {
      const feed = await parser.parseURL(url);
      let addedCount = 0;
      for (const item of feed.items) {
        const link = item.link || item.title || "";
        if (processedUrls.has(link)) continue;
        processedUrls.add(link);
        if (processedUrls.size > 5000) {
          const iterator = processedUrls.values();
          processedUrls.delete(iterator.next().value!);
        }

        // Write to database
        const hash = crypto
          .createHash("md5")
          .update(item.link || item.title || "")
          .digest("hex");
        try {
          await drizzleDb
            .insert(sourceItems)
            .values({
              id: `src-${hash}`,
              sourceName: (item as any).source || "Global Syndicate",
              sourceUrl: url,
              originalUrl: item.link || "#",
              originalTitle: item.title,
              originalPublishedAt: item.isoDate
                ? new Date(item.isoDate)
                : new Date(),
              excerpt: item.contentSnippet
                ? item.contentSnippet.substring(0, 300)
                : null,
              category: url.includes("economy")
                ? "Economy"
                : url.includes("technology")
                  ? "Tech Policy"
                  : url.includes("climate")
                    ? "Climate"
                    : url.includes("cyber")
                      ? "Security"
                      : "Geopolitics",
              contentHash: hash,
            })
            .onConflictDoNothing();
        } catch (e) {
          // silent fail for unique constraints
        }

        fetchImageCounter++;

        const cat = url.includes("economy")
          ? "Economy"
          : url.includes("technology")
            ? "Technology"
            : url.includes("climate")
              ? "Climate"
              : url.includes("cyber")
                ? "Security"
                : "Geopolitics";

        const titleStr = item.title || "Untitled Intelligence";
        const canonicalId = crypto.createHash("sha256").update(item.link || item.title || "").digest("hex");
        const imgFields = assignImageFields(titleStr, cat);

        // Detect region
        const textToSearch = (titleStr + " " + (item.contentSnippet || "")).toLowerCase();
        let regionStr = "Global";
        if (textToSearch.includes("gcc") || textToSearch.includes("gulf") || textToSearch.includes("uae") || textToSearch.includes("dubai")) regionStr = "GCC";
        else if (textToSearch.includes("saudi")) regionStr = "Saudi Arabia";
        else if (textToSearch.includes("india") || textToSearch.includes("modi")) regionStr = "India";
        else if (textToSearch.includes("us") || textToSearch.includes("america") || textToSearch.includes("biden") || textToSearch.includes("trump")) regionStr = "World";
        else if (textToSearch.includes("uk") || textToSearch.includes("europe")) regionStr = "World";

        const newArticle: Article = {
          id: `article-${canonicalId}`,
          title: titleStr,
          slug: `article-${canonicalId}`,
          sourceName: (item as any).source || "Global Syndicate",
          sourceUrl: url,
          originalUrl: item.link || "#",
          publishedAt: item.isoDate || new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          category: cat,
          region: regionStr,
          language: "en",
          aiSummary: item.contentSnippet
            ? item.contentSnippet.substring(0, 300) + "..."
            : "Initial signals intercepted. Awaiting full AI analysis.",
          fullContent:
            (item as any)["content:encoded"] ||
            item.content ||
            `<p>The unfolding situation regarding <strong>${item.title || "this matter"}</strong> has significant implications across multiple sectors. Early intelligence suggests a pivot in fundamental strategies, echoing past historical volatility.</p><p>Regional experts emphasize caution. According to preliminary analysis: <em>"${item.contentSnippet ? item.contentSnippet.substring(0, 300) : "No initial summary available."}"</em></p><p>As markets and political entities react, supply chain logistics and diplomatic channels are expected to experience moderate interruptions. The long-term resonance of this event remains categorized as actively evolving.</p><p>Additional operational updates will be broadcast as further verified data points are processed through the Global Syndicate intelligence apparatus.</p>`,
          tags: ["Live Feed", "Unclassified"],
          importanceScore: 70 + Math.floor(Math.random() * 20),
          relevanceScore: 75 + Math.floor(Math.random() * 20),
          credibilityScore: 85,
          ...imgFields,
        };

        // Write directly to Firebase
        await setDoc(doc(firebaseDb, "articles", newArticle.id), newArticle);

        addedCount++;
      }
      if (addedCount > 0) {
        console.log(`Ingested ${addedCount} new items from ${url}`);
      }
    } catch (e) {
      console.error("Failed to parse RSS", url, e);
    }
  }
}

async function startServer() {
  const app = express();
  // Trust the reverse proxy (specifically required for express-rate-limit behind a proxy like here in the container)
  app.set("trust proxy", 1); 
  const PORT = 3000;

  // Add middlewares
  app.use(express.json());

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true, 
    legacyHeaders: false,
  });

  const analyzeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20, // 20 analyzes per 15 min
    message: "Too many analyze requests from this IP.",
    standardHeaders: true, 
    legacyHeaders: false,
  });

  app.use("/api/news", apiLimiter);
  app.use("/api/news/:id/analyze", analyzeLimiter);

  app.get("/api/assets/visual", (req, res) => {
      res.status(404).send('Not found');
  });
    

  // Background fetch
  pollRSSFeeds();
  setInterval(pollRSSFeeds, 30 * 60 * 1000); // 30 mins

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/news", async (req, res) => {
    try {
      const { region, category, limit } = req.query;
      let q = collection(firebaseDb, "articles") as any;

      if (
        region &&
        typeof region === "string" &&
        region.toLowerCase() !== "global"
      ) {
         // Title case the region for firestore match
        const formattedRegion = region.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        q = query(q, where("region", "in", [region, formattedRegion, region.toUpperCase()]));
      }
      if (category && typeof category === "string") {
        const formattedCat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        q = query(q, where("category", "in", [category, formattedCat, 'Tech Policy', 'Technology']));
      }

      const count = limit ? parseInt(limit as string, 10) : 100; // Increase slightly since we might dedupe

      const snap = await getDocs(
        query(q, orderBy("publishedAt", "desc"), fsLimit(count)),
      );
      let data = snap.docs.map((d) => d.data());
      
      const seenTitles = new Set();
      data = data.filter((m: any) => {
         if (seenTitles.has(m.title)) return false;
         seenTitles.add(m.title);
         return true;
      });
      
      if (limit) {
         data = data.slice(0, parseInt(limit as string, 10));
      }

      data = data.map((m: any) => {
         if (m.imageUrl && (m.imageUrl.includes('picsum.photos') || m.imageUrl.includes('api/assets/visual'))) {
             m.imageUrl = getStableImage(m.title || "default", m.category || 'Editorial');
         }
         return m;
      });

      res.json({ data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.post("/api/news", requireAuth, express.json(), async (req, res) => {
    const data = req.body;
    const tags = data.tags || [];

    // if breaking/popular/exclusive are passed in tags, give it higher relevance
    let relScore = 80;
    if (tags.includes("Breaking")) relScore += 10;
    if (tags.includes("Exclusive")) relScore += 5;
    if (tags.includes("Popular")) relScore += 5;

    const canonicalId = crypto.createHash("sha256").update(data.title || "Untitled" + Date.now().toString()).digest("hex");

    const newArticle: Article = {
      id: `editorial-${canonicalId}`,
      title: data.title || "Untitled",
      slug: `editorial-${canonicalId}`,
      sourceName: data.sourceName || "Internal Desk",
      sourceUrl: "#",
      originalUrl: "#",
      publishedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      category: data.category || "General",
      region: data.region || "Global",
      language: "en",
      aiSummary:
        data.summary ||
        (data.fullContent ? data.fullContent.substring(0, 150) : "No summary."),
      fullContent: data.fullContent || "No content.",
      tags: tags,
      importanceScore: 95,
      relevanceScore: relScore,
      credibilityScore: 100,
      ...assignImageFields(
        data.title || "Untitled",
        data.category || "General",
      ),
    };

    await setDoc(doc(firebaseDb, "articles", newArticle.id), newArticle);
    res.json({ success: true, data: newArticle });
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
      const snap = await getDoc(doc(firebaseDb, "articles", req.params.id));
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });
      const m = snap.data();
      if (m.imageUrl && (m.imageUrl.includes('picsum.photos') || m.imageUrl.includes('api/assets/visual'))) {
          m.imageUrl = getStableImage(m.title || "default", m.category || 'Editorial');
      }
      res.json({ data: m });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post("/api/news/:id/analyze", async (req, res) => {
    try {
      const docRef = doc(firebaseDb, "articles", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return res.status(404).json({ error: "Not found" });

      const article = snap.data() as Article;

      if (article.tags.includes("AI Analyzed") && !article.keyPoints?.includes("Analysis failed or rate limited") && !article.keyPoints?.includes("Live analysis unavailable")) {
        return res.json({ data: article });
      }

      const ai = getGemini();
      if (ai) {
        const prompt = `You are an executive intelligence briefer. Analyze the following news story and output JSON.

Title: ${article.title}
Summary: ${article.aiSummary}
Content: ${article.fullContent}

Output exactly this JSON format:
{
  "keyPoints": ["point 1", "point 2", "point 3"],
  "whyItMatters": "Overview of why this is important",
  "tags": ["Tag1", "Tag2"],
  "sentiment": "positive | neutral | negative | mixed",
  "credibilityScore": 85 /* int out of 100 based on source and content tone */
}`;
        
        try {
          const response = await ai.models.generateContent({
             model: 'gemini-1.5-flash',
             contents: prompt,
             config: {
                 responseMimeType: 'application/json',
                 maxOutputTokens: 250 // limit output length for speed
             }
          });
          const parsed = JSON.parse(response.text || '{}');
          article.keyPoints = parsed.keyPoints || [];
          article.whyItMatters = parsed.whyItMatters || "Context pending further review.";
          
          let updatedTags = article.tags.filter(t => t !== "Unclassified");
          if (parsed.tags && Array.isArray(parsed.tags)) {
              updatedTags = [...updatedTags, ...parsed.tags];
          }
          article.tags = [...new Set([...updatedTags, "AI Analyzed"])];

          if (parsed.sentiment) article.sentiment = parsed.sentiment;
          if (parsed.credibilityScore && typeof parsed.credibilityScore === 'number') {
              article.credibilityScore = parsed.credibilityScore;
          }
        } catch (aiErr) {
          console.error("Gemini analysis failed", aiErr);
          article.keyPoints = ["Analysis failed or rate limited", "Pending secondary review"];
          article.whyItMatters = "Unable to process context at this time.";
        }
      } else {
        article.keyPoints = ["Live analysis unavailable"];
        article.whyItMatters = "AI Intelligence service disconnected.";
      }

      await setDoc(docRef, article);
      if (article.imageUrl && (article.imageUrl.includes('picsum.photos') || article.imageUrl.includes('api/assets/visual'))) {
          article.imageUrl = getStableImage(article.title || "default", article.category || 'Editorial');
      }
      res.json({ data: article });
    } catch (e) {
      res.status(500).json({ error: "Failed to analyze" });
    }
  });

  let cachedMarketPulse: any = null;
  let lastMarketPulseTime = 0;

  app.get("/api/market-pulse", async (req, res) => {
    if (cachedMarketPulse && Date.now() - lastMarketPulseTime < 5 * 60 * 1000) {
      return res.json({ data: cachedMarketPulse });
    }

    try {
      const symbols = ["^GSPC", "CL=F", "DX-Y.NYB", "CNY=X"];
      const quotes = await yahooFinance.quote(symbols);
      const pulse = quotes.map((q) => ({
        symbol: q.symbol,
        name: q.shortName || q.symbol,
        price: q.regularMarketPrice,
        changePercent: q.regularMarketChangePercent,
      }));
      cachedMarketPulse = pulse;
      lastMarketPulseTime = Date.now();
      res.json({ data: pulse });
    } catch (e) {
      console.error("Market pulse failed", e);
      // Fallback mock
      res.json({
        data: [
          {
            symbol: "^GSPC",
            name: "S&P 500",
            price: 5864.22,
            changePercent: 0.12,
          },
          {
            symbol: "CL=F",
            name: "Brent Crude",
            price: 74.32,
            changePercent: -1.42,
          },
          {
            symbol: "CNY=X",
            name: "USD/CNY",
            price: 7.12,
            changePercent: 0.04,
          },
        ],
      });
    }
  });

  let cachedBriefing: any = null;
  let lastBriefingTime = 0;

  app.get("/api/briefings", async (req, res) => {
    if (cachedBriefing && Date.now() - lastBriefingTime < 30 * 60 * 1000) {
      return res.json({ data: cachedBriefing });
    }

    // Dynamic briefing generation based on latest articles
    const ai = getGemini();
    if (ai) {
      try {
        const snap = await getDocs(
          query(
            collection(firebaseDb, "articles"),
            orderBy("publishedAt", "desc"),
            fsLimit(7),
          ),
        );
        const latest = snap.docs.map((d) => d.data() as Article);

        const recentStories = latest
          .map((a) => `- ${a.title}: ${a.aiSummary.substring(0, 100)}`)
          .join("\n");
        const prompt = `You are a geopolitical intelligence briefer. Create a daily executive briefing based on these latest events: \n${recentStories}\n\nReturn JSON: {"executiveSummary": "overview paragraph", "keyThemes": ["theme1", "theme2"]}`;

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
        });
        const text = response.text || "{}";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          cachedBriefing = [
            {
              id: "live-briefing",
              date: new Date().toISOString(),
              title: "Live Global Briefing",
              briefingTitle: "Current Geopolitical Intelligence",
              executiveSummary:
                parsed.executiveSummary || mockBriefings[0].executiveSummary,
              keyThemes: parsed.keyThemes || [
                "Global Instability",
                "Market Shifts",
              ],
              topStories: latest.slice(0, 5).map((a) => ({
                headline: a.title,
                sources: [a.sourceName],
                summary: a.aiSummary.substring(0, 150) + "...",
                whyItMatters: "Awaiting detailed AI context.",
                whatToWatch: "Watch for secondary state reactions.",
              })),
            },
          ];
          lastBriefingTime = Date.now();
          return res.json({ data: cachedBriefing });
        }
      } catch (e: any) {
        // Silent fallback
      }
    }
    res.json({ data: cachedBriefing || mockBriefings });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
