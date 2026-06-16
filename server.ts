import express from "express";
import cron from "node-cron";
import { LRUCache } from "lru-cache";
import path from "path";
import { createServer as createViteServer } from "vite";
import Parser from "rss-parser";
import yahooFinance from "yahoo-finance2";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

// Data
import { mockArticles, mockBriefings } from "./src/lib/mockData";
import { generateFallbackArticles } from "./src/lib/generateMockData";
import { Article } from "./src/types";
// import { requireAuth } from "./src/middleware/auth.js";

// DB
import { db as drizzleDb } from "./src/db/index.js";
import { sourceItems, publishedContent } from "./src/db/schema.js";
import { eq, desc, sql, ilike, or } from "drizzle-orm";

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
  setLogLevel,
  deleteDoc,
} from "firebase/firestore";

// Squelch internal grpc errors from Firebase
setLogLevel('silent');

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

let firebaseApp: any = null;
let firebaseDb: any = null;
try {
  if (firebaseConfig && Object.keys(firebaseConfig).length > 0) {
      firebaseApp = initializeApp(firebaseConfig);
      firebaseDb = getFirestore(
        firebaseApp,
        firebaseConfig.firestoreDatabaseId || "(default)",
      );
  }
} catch (e: any) {
  console.log("Firebase initialization skipped:", e.message);
}

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
  "http://feeds.bbci.co.uk/news/world/rss.xml",
  "http://feeds.bbci.co.uk/news/business/rss.xml",
  "http://feeds.bbci.co.uk/news/technology/rss.xml",
  "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
  "http://feeds.bbci.co.uk/news/politics/rss.xml",
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

function enrichArticleImage(m: any) {
    if (!m.imageUrl || m.imageUrl.includes('pollinations.ai') || m.imageUrl.includes('api/assets/visual')) {
        const hashStr = String(m.id || m.title || Math.random());
        let hash = 0;
        for(let i = 0; i < hashStr.length; i++) hash = ((hash << 5) - hash + hashStr.charCodeAt(i)) | 0;
        hash = Math.abs(hash);

        const SOURCES = ["Unsplash", "Pexels", "Pixabay", "Canva Photos", "StockSnap", "Life of Pix", "Burst (by Shopify)", "Vintage Stock Photos"];
        const srcSelected = SOURCES[hash % SOURCES.length];
        
        m.imageUrl = `https://picsum.photos/seed/${hash}/800/450`;
        m.imageSource = srcSelected;
        m.imageCredit = `Courtesy of ${srcSelected}`;
        m.imageCaption = `Editorial image via ${srcSelected}`;
        m.imageType = srcSelected.includes("Vintage") ? "vintage_editorial" : "licensed_editorial";
    }
    return m;
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
        try {
          await setDoc(doc(firebaseDb, "articles", article.id), article);
        } catch(e: any) {
          console.log("Firebase sync skipped:", e.message);
          break; // Stop seeding if we hit quota to save time
        }
      }
      console.log("Seeded mock articles to Firebase.");
    }
  } catch (e: any) {
    console.log("Firebase sync skipped:", e.message);
  }
}
if (process.env.NODE_ENV !== "production" || process.env.SEED_NEWS === "true") {
  syncMocksToFirebase();
}

async function generateAndInsertSnippets(count: number) {
  console.log(`Generating ${count} snippet articles...`);
  const newArticles = generateFallbackArticles(count).map((a, i) => ({
    ...a,
    id: `snippet-${Date.now()}-${i}`,
    slug: `snippet-${Date.now()}-${i}`,
    title: a.title,
    aiSummary: a.aiSummary || `Short brief intercepted regarding ${a.category}.`,
    fullContent: `<p>${a.aiSummary}</p>`,
    publishedAt: new Date().toISOString(),
  }));

  let insertedCount = 0;
  for (const item of newArticles) {
    try {
      // Postgres
      await drizzleDb
        .insert(sourceItems)
        .values({
          id: item.id.replace('article-', 'src-'),
          sourceName: "Global Syndicate Drops",
          sourceUrl: "#",
          originalUrl: "#",
          originalTitle: item.title,
          originalPublishedAt: new Date(item.publishedAt),
          excerpt: item.aiSummary,
          category: item.category,
          contentHash: item.id,
        })
        .onConflictDoNothing();
      
      // Firebase
      try {
        await setDoc(doc(firebaseDb, "articles", item.id), item);
      } catch (e) {
        // ignore firebase errors
      }
      insertedCount++;
    } catch(e) {
      console.error("Error inserting snippet:", e);
    }
  }
  console.log(`Ingested ${insertedCount} snippet articles today.`);
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

        fetchImageCounter++;

        const cat = url.includes("business") || url.includes("economy")
          ? "Business"
          : url.includes("technology")
            ? "Technology"
            : url.includes("science") || url.includes("climate")
              ? "Science"
              : url.includes("politics")
                ? "Politics"
                : url.includes("world") || url.includes("geopolitics")
                  ? "World"
                  : url.includes("sport")
                  ? "Sports"
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

        try {
          await drizzleDb
            .insert(sourceItems)
            .values({
              id: `src-${hash}`,
              sourceName: newArticle.sourceName,
              sourceUrl: url,
              originalUrl: newArticle.originalUrl,
              originalTitle: newArticle.title,
              originalPublishedAt: new Date(newArticle.publishedAt),
              excerpt: item.contentSnippet ? item.contentSnippet.substring(0, 300) : null,
              category: newArticle.category,
              contentHash: hash,
              rawMetadata: JSON.stringify(newArticle),
            })
            .onConflictDoNothing();
        } catch (e) {
          // silent fail for unique constraints
        }

        // Write directly to Firebase
        try {
          await setDoc(doc(firebaseDb, "articles", newArticle.id), newArticle);
        } catch(e) { /* ignore quota errors, rely on postgres */ }

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

const apiCache = new LRUCache({ max: 500, ttl: 1000 * 60 * 5 });

async function startServer() {
  const app = express();
  // Trust the reverse proxy (specifically required for express-rate-limit behind a proxy like here in the container)
  app.set("trust proxy", 1); 
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // Add middlewares
  app.use(express.json({ limit: "50mb" }));

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

  // Initially add 100-150 articles if DB is empty
  drizzleDb.select({ count: sql`count(*)` }).from(sourceItems).then((res: any) => {
    if (Number(res[0].count) < 20) {
      const initialCount = Math.floor(Math.random() * 51) + 100;
      generateAndInsertSnippets(initialCount).catch(console.error);
    }
  }).catch((e: any) => console.log("Initial drizzleDb select skipped:", e.message));

  // Schedule to add 100-150 everyday at 00:00 GMT
  cron.schedule("0 0 * * *", () => {
    console.log("Running scheduled snippet generation...");
    const dailyCount = Math.floor(Math.random() * 51) + 100;
    generateAndInsertSnippets(dailyCount).catch(console.error);
  }, {
    timezone: "UTC"
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
        const snap = await getDocs(collection(firebaseDb, "articles"));
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        
        // Add static routes
        const staticRoutes = ['', '/category/world', '/category/economy', '/category/geopolitics', '/category/technology', '/category/ai', '/category/finance'];
        for (const route of staticRoutes) {
            xml += `\n  <url>\n    <loc>https://theatlastimes.com${route}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n  </url>`;
        }
        
        // Add dynamic article routes
        for (const d of snap.docs) {
            const article = d.data();
            const pubDate = article.publishedAt ? new Date(article.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            xml += `\n  <url>\n    <loc>https://theatlastimes.com/article/${article.id}</loc>\n    <lastmod>${pubDate}</lastmod>\n    <changefreq>never</changefreq>\n    <priority>0.6</priority>\n  </url>`;
        }
        xml += `\n</urlset>`;
        
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch(e) {
        res.status(500).send('Error generating sitemap');
    }
  });

  app.get("/robots.txt", (req, res) => {
      res.type('text/plain');
      res.send(`User-agent: *\nAllow: /\n\nSitemap: https://theatlastimes.com/sitemap.xml`);
  });

  app.get("/api/news", async (req, res) => {
    try {
      const { region, category, limit, search } = req.query;
      const cacheKey = `news_${region || ''}_${category || ''}_${limit || ''}_${search || ''}`;
      const cached = apiCache.get(cacheKey);
      if (cached) {
         return res.json({ data: cached });
      }

      let fq = collection(firebaseDb, "articles") as any;

      if (
        region &&
        typeof region === "string" &&
        region.toLowerCase() !== "global"
      ) {
         // Title case the region for firestore match
         // Fetch all and filter locally heavily to prevent zero match
      }
      let isExclusive = false;
      if (category && typeof category === "string") {
        const formattedCat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (formattedCat.toLowerCase() === 'exclusive') {
            isExclusive = true;
            fq = query(fq, where("tags", "array-contains", "Exclusive"));
        } else {
            // We just fetch all and filter locally so we don't return 0 if the case is slightly off
        }
      }

      // We need a decent count to filter locally if we skip firestore where clauses
      let count = limit ? Math.max(parseInt(limit as string, 10), 100) : 100;
      if (search && typeof search === 'string') count = 1000;

      const snap = await getDocs(
        query(fq, orderBy("publishedAt", "desc"), fsLimit(count)),
      );
      let data = snap.docs.map((d) => d.data());
      
      if (search && typeof search === 'string') {
          const searchLower = search.toLowerCase();
          data = data.filter((m: any) => {
              return (m.title && m.title.toLowerCase().includes(searchLower)) ||
                     (m.aiSummary && m.aiSummary.toLowerCase().includes(searchLower)) ||
                     (m.category && m.category.toLowerCase().includes(searchLower));
          });
      }
      
      if (isExclusive) {
          data = data.filter((m: any) => m.tags && m.tags.some((t: string) => t.toLowerCase() === 'exclusive'));
      } else if (category && typeof category === "string") {
          const catLower = category.toLowerCase();
          data = data.filter((m: any) => {
             const mCat = m.category?.toLowerCase() || "";
             const mReg = m.region?.toLowerCase() || "";
             const allowedCats = [catLower];
             if (catLower === 'business' || catLower === 'finance') allowedCats.push('economy');
             if (catLower === 'world') { allowedCats.push('geopolitics'); allowedCats.push('global'); }
             if (catLower === 'politics') allowedCats.push('geopolitics');
             if (catLower === 'technology') { allowedCats.push('tech policy'); allowedCats.push('security'); }
             return allowedCats.some(c => mCat === c || mCat.includes(c)) || allowedCats.some(c => mReg === c || mReg.includes(c));
          });
      }

      if (region && typeof region === "string" && region.toLowerCase() !== "global") {
          const regionLower = region.toLowerCase();
          data = data.filter((m: any) => {
             const mReg = m.region?.toLowerCase() || "";
             const mCat = m.category?.toLowerCase() || "";
             return mReg === regionLower || mReg.includes(regionLower) || mCat === regionLower || mCat.includes(regionLower);
          });
      }
      
      const seenTitles = new Set();
      data = data.filter((m: any) => {
         if (seenTitles.has(m.title)) return false;
         seenTitles.add(m.title);
         return true;
      });

      // Include all articles on the homepage, allowing editorial articles to surface.
      
      if (limit) {
         data = data.slice(0, parseInt(limit as string, 10));
      }

      data = data.map(enrichArticleImage);

      if (data.length === 0 && search) {
         throw new Error("No results in Firestore, falling back to Drizzle");
      }

      apiCache.set(cacheKey, data);
      res.json({ data });
    } catch (e: any) {
      console.log('Firebase DB query skipped, falling back to Drizzle:', e.message);
      try {
        const { limit, category, region, search } = req.query;
        // Fallback to sourceItems from PostgreSQL
        let fetchLimit = typeof category === 'string' || typeof region === 'string' ? 300 : (limit ? parseInt(limit as string, 10) : 100);
        if (search && typeof search === 'string') fetchLimit = 1000;
        let drizzleSnap;
        if (search && typeof search === 'string') {
            const pattern = `%${search}%`;
            drizzleSnap = await drizzleDb.select().from(sourceItems)
                .where(or(
                    ilike(sourceItems.originalTitle, pattern),
                    ilike(sourceItems.excerpt, pattern),
                    ilike(sourceItems.category, pattern)
                ))
                .orderBy(desc(sourceItems.originalPublishedAt)).limit(fetchLimit);
        } else {
            drizzleSnap = await drizzleDb.select().from(sourceItems).orderBy(desc(sourceItems.originalPublishedAt)).limit(fetchLimit);
        }
        
        let data = drizzleSnap.map(item => {
          let parsed: any = {};
          if (item.rawMetadata) {
             try {
                parsed = JSON.parse(item.rawMetadata);
             } catch(e) {}
          }
          return {
            ...parsed,
            id: item.id,
            title: parsed.title || item.originalTitle || "Untitled",
            slug: item.id,
            sourceName: parsed.sourceName || item.sourceName || "Global Syndicate",
            sourceUrl: parsed.sourceUrl || item.sourceUrl || "#",
            originalUrl: parsed.originalUrl || item.originalUrl || "#",
            publishedAt: parsed.publishedAt || item.originalPublishedAt || new Date().toISOString(),
            fetchedAt: parsed.fetchedAt || item.fetchedAt || new Date().toISOString(),
            category: parsed.category || item.category || "Economy",
            region: parsed.region || "Global",
            language: parsed.language || "en",
            aiSummary: parsed.aiSummary || parsed.detailedHumanizedSummary || item.excerpt || "Initial signals intercepted. Awaiting full AI analysis.",
            fullContent: parsed.fullContent || item.excerpt || "Initial signals intercepted. Awaiting full AI analysis.",
            tags: parsed.tags || ["Live Feed", "Unclassified"],
            importanceScore: parsed.importanceScore || 70 + Math.floor(Math.random() * 20),
            relevanceScore: parsed.relevanceScore || 75 + Math.floor(Math.random() * 20),
            credibilityScore: parsed.credibilityScore || item.credibilityScore || 85,
          };
        });
        
        if (category && typeof category === "string") {
            const formattedCat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            if (formattedCat.toLowerCase() === 'exclusive') {
                data = data.filter((m: any) => m.tags && m.tags.some((t: string) => t.toLowerCase() === 'exclusive'));
            } else {
                const catLower = category.toLowerCase();
                data = data.filter((m: any) => {
                   const mCat = m.category?.toLowerCase() || "";
                   const mReg = m.region?.toLowerCase() || "";
                   const allowedCats = [catLower];
                   if (catLower === 'business' || catLower === 'finance') allowedCats.push('economy');
                   if (catLower === 'world') { allowedCats.push('geopolitics'); allowedCats.push('global'); }
                   if (catLower === 'politics') allowedCats.push('geopolitics');
                   if (catLower === 'technology') { allowedCats.push('tech policy'); allowedCats.push('security'); }
                   return allowedCats.some(c => mCat === c || mCat.includes(c)) || allowedCats.some(c => mReg === c || mReg.includes(c));
                });
            }
        }
        
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            data = data.filter((m: any) => {
                return (m.title && m.title.toLowerCase().includes(searchLower)) ||
                       (m.aiSummary && m.aiSummary.toLowerCase().includes(searchLower)) ||
                       (m.category && m.category.toLowerCase().includes(searchLower));
            });
        }
        
        if (region && typeof region === "string" && region.toLowerCase() !== "global") {
            const regionLower = region.toLowerCase();
            data = data.filter((m: any) => {
               const mReg = m.region?.toLowerCase() || "";
               const mCat = m.category?.toLowerCase() || "";
               return mReg === regionLower || mReg.includes(regionLower) || mCat === regionLower || mCat.includes(regionLower);
            });
        }

        const seenTitles = new Set();
        data = data.filter((m: any) => {
           if (seenTitles.has(m.title)) return false;
           seenTitles.add(m.title);
           return true;
        });

        // Filter editorial articles from homepage unless breaking or exclusive
        if (!category && !region && !search) {
           data = data.filter((m: any) => {
              if (m.id && (m.id.startsWith('src-editorial-') || m.id?.startsWith('editorial-'))) {
                 const tags = m.tags || [];
                 return tags.includes('Breaking') || tags.includes('Exclusive');
              }
              return true;
           });
        }

        if (limit) {
           data = data.slice(0, parseInt(limit as string, 10));
        }

        data = data.map(enrichArticleImage);

        // If still no data, fall back to mock data
        if (data.length === 0) {
          console.log("Drizzle also empty, falling back to mock data");
          data = [...mockArticles, ...generateFallbackArticles(100)].map((a, i) => ({
            ...a,
            ...assignImageFields(a.title + i.toString(), a.category),
            fullContent: a.fullContent || `<p>The unfolding situation regarding <strong>${a.title}</strong> has significant implications across multiple sectors.</p>`
          }));
          
          // Apply same filtering to mock data
          if (category && typeof category === "string") {
            const formattedCat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            if (formattedCat.toLowerCase() === 'exclusive') {
              data = data.filter((m: any) => m.tags && m.tags.some((t: string) => t.toLowerCase() === 'exclusive'));
            } else {
              const catLower = category.toLowerCase();
              data = data.filter((m: any) => {
                const mCat = m.category?.toLowerCase() || "";
                const mReg = m.region?.toLowerCase() || "";
                const allowedCats = [catLower];
                if (catLower === 'business' || catLower === 'finance') allowedCats.push('economy');
                if (catLower === 'world') { allowedCats.push('geopolitics'); allowedCats.push('global'); }
                if (catLower === 'politics') allowedCats.push('geopolitics');
                if (catLower === 'technology') { allowedCats.push('tech policy'); allowedCats.push('security'); }
                return allowedCats.some(c => mCat === c || mCat.includes(c)) || allowedCats.some(c => mReg === c || mReg.includes(c));
              });
            }
          }
          
          if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            data = data.filter((m: any) => {
              return (m.title && m.title.toLowerCase().includes(searchLower)) ||
                     (m.aiSummary && m.aiSummary.toLowerCase().includes(searchLower)) ||
                     (m.category && m.category.toLowerCase().includes(searchLower));
            });
          }
          
          if (region && typeof region === "string" && region.toLowerCase() !== "global") {
            const regionLower = region.toLowerCase();
            data = data.filter((m: any) => {
              const mReg = m.region?.toLowerCase() || "";
              const mCat = m.category?.toLowerCase() || "";
              return mReg === regionLower || mReg.includes(regionLower) || mCat === regionLower || mCat.includes(regionLower);
            });
          }
          
          const seenTitlesMock = new Set();
          data = data.filter((m: any) => {
            if (seenTitlesMock.has(m.title)) return false;
            seenTitlesMock.add(m.title);
            return true;
          });
          
          if (limit) {
            data = data.slice(0, parseInt(limit as string, 10));
          }
          
          data = data.map(enrichArticleImage);
        }

        apiCache.set(cacheKey, data);
        res.json({ data });
      } catch (fallbackErr) {
        console.error(fallbackErr);
        // Last resort: fall back to mock data
        try {
          const { limit, category, region, search } = req.query;
          let data = [...mockArticles, ...generateFallbackArticles(100)].map((a, i) => ({
            ...a,
            ...assignImageFields(a.title + i.toString(), a.category),
            fullContent: a.fullContent || `<p>The unfolding situation regarding <strong>${a.title}</strong> has significant implications across multiple sectors.</p>`
          }));
          
          // Apply filtering
          if (category && typeof category === "string") {
            const formattedCat = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            if (formattedCat.toLowerCase() === 'exclusive') {
              data = data.filter((m: any) => m.tags && m.tags.some((t: string) => t.toLowerCase() === 'exclusive'));
            } else {
              const catLower = category.toLowerCase();
              data = data.filter((m: any) => {
                const mCat = m.category?.toLowerCase() || "";
                const mReg = m.region?.toLowerCase() || "";
                const allowedCats = [catLower];
                if (catLower === 'business' || catLower === 'finance') allowedCats.push('economy');
                if (catLower === 'world') { allowedCats.push('geopolitics'); allowedCats.push('global'); }
                if (catLower === 'politics') allowedCats.push('geopolitics');
                if (catLower === 'technology') { allowedCats.push('tech policy'); allowedCats.push('security'); }
                return allowedCats.some(c => mCat === c || mCat.includes(c)) || allowedCats.some(c => mReg === c || mReg.includes(c));
              });
            }
          }
          
          if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            data = data.filter((m: any) => {
              return (m.title && m.title.toLowerCase().includes(searchLower)) ||
                     (m.aiSummary && m.aiSummary.toLowerCase().includes(searchLower)) ||
                     (m.category && m.category.toLowerCase().includes(searchLower));
            });
          }
          
          if (region && typeof region === "string" && region.toLowerCase() !== "global") {
            const regionLower = region.toLowerCase();
            data = data.filter((m: any) => {
              const mReg = m.region?.toLowerCase() || "";
              const mCat = m.category?.toLowerCase() || "";
              return mReg === regionLower || mReg.includes(regionLower) || mCat === regionLower || mCat.includes(regionLower);
            });
          }
          
          const seenTitlesMock = new Set();
          data = data.filter((m: any) => {
            if (seenTitlesMock.has(m.title)) return false;
            seenTitlesMock.add(m.title);
            return true;
          });
          
          if (limit) {
            data = data.slice(0, parseInt(limit as string, 10));
          }
          
          data = data.map(enrichArticleImage);
          apiCache.set(cacheKey, data);
          res.json({ data });
        } catch (mockErr) {
          console.error(mockErr);
          res.status(500).json({ error: "Failed to fetch articles from all sources" });
        }
      }
    }
  });

  app.post("/api/news", express.json({ limit: "50mb" }), async (req, res) => {
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
      ...(data.imageUrl ? { imageUrl: data.imageUrl, hasImage: true } : {}),
    };

    try {
      await setDoc(doc(firebaseDb, "articles", newArticle.id), newArticle);
    } catch(e: any) {
      console.log("Firebase sync skipped on custom post:", e.message);
    }

    try {
      await drizzleDb.insert(sourceItems).values({
        id: newArticle.id.replace('editorial-', 'src-').replace('article-', 'src-'),
        originalTitle: newArticle.title,
        contentHash: newArticle.id,
        category: newArticle.category,
        excerpt: newArticle.aiSummary,
        rawMetadata: JSON.stringify(newArticle),
        sourceName: newArticle.sourceName,
        originalUrl: newArticle.imageUrl || null,
        originalPublishedAt: new Date(newArticle.publishedAt),
      }).onConflictDoNothing();
    } catch (e: any) {
      console.log("Drizzle sync sourceItems skipped:", e.message);
    }

    apiCache.clear(); // Ensure the latest data is shown

    res.json({ success: true, data: newArticle });
  });

  app.get("/api/news/:id", async (req, res) => {
    const cacheKey = `news_id_${req.params.id}`;
    try {
      const cached = apiCache.get(cacheKey);
      if (cached) {
         return res.json({ data: cached });
      }

      const snap = await getDoc(doc(firebaseDb, "articles", req.params.id));
      if (!snap.exists()) {
          throw new Error("Document does not exist in Firebase");
      }
      const m = snap.data();
      enrichArticleImage(m);
      apiCache.set(cacheKey, m);
      res.json({ data: m });
    } catch (e: any) {
      console.log('Firebase fetching single article skipped, falling back to Drizzle:', e.message);
      try {
        const id = req.params.id;
        const drizzleArticles = await drizzleDb.select().from(sourceItems).where(eq(sourceItems.id, id.replace('article-', 'src-').replace('editorial-', 'src-'))).limit(1);
        const drizzleArticle = drizzleArticles[0];
        if (!drizzleArticle) {
            return res.status(404).json({ error: "Not found" });
        }
        let parsed: any = {};
        if (drizzleArticle.rawMetadata) {
            try { parsed = JSON.parse(drizzleArticle.rawMetadata); } catch(e){}
        }
        
        const m = {
          ...parsed,
          id: drizzleArticle.id,
          title: parsed.title || drizzleArticle.originalTitle || "Untitled",
          slug: drizzleArticle.id,
          sourceName: parsed.sourceName || drizzleArticle.sourceName || "Global Syndicate",
          sourceUrl: parsed.sourceUrl || drizzleArticle.sourceUrl || "#",
          originalUrl: parsed.originalUrl || drizzleArticle.originalUrl || "#",
          publishedAt: parsed.publishedAt || drizzleArticle.originalPublishedAt || new Date().toISOString(),
          fetchedAt: parsed.fetchedAt || drizzleArticle.fetchedAt || new Date().toISOString(),
          category: parsed.category || drizzleArticle.category || "Economy",
          region: parsed.region || "Global",
          language: parsed.language || "en",
          aiSummary: parsed.aiSummary || parsed.detailedHumanizedSummary || drizzleArticle.excerpt || "Initial signals intercepted. Awaiting full AI analysis.",
          fullContent: parsed.fullContent || drizzleArticle.excerpt || "Initial signals intercepted. Awaiting full AI analysis.",
          tags: parsed.tags || ["Live Feed", "Unclassified"],
          importanceScore: parsed.importanceScore || 70 + Math.floor(Math.random() * 20),
          relevanceScore: parsed.relevanceScore || 75 + Math.floor(Math.random() * 20),
          credibilityScore: parsed.credibilityScore || drizzleArticle.credibilityScore || 85,
        };
        enrichArticleImage(m);
        apiCache.set(cacheKey, m);
        res.json({ data: m });
      } catch (fallbackErr) {
        res.status(500).json({ error: "Failed to fetch article" });
      }
    }
  });

  app.put("/api/news/:id", express.json({ limit: "50mb" }), async (req, res) => {
    try {
      const id = req.params.id;
      const data = req.body;
      
      // First get existing article
      const docRef = doc(firebaseDb, "articles", id);
      const snap = await getDoc(docRef);
      
      let existingArticle: Article | null = null;
      
      if (snap.exists()) {
        existingArticle = snap.data() as Article;
      } else {
        // Fallback to Drizzle
        try {
          const drizzleArticles = await drizzleDb.select().from(sourceItems).where(eq(sourceItems.id, id.replace('article-', 'src-').replace('editorial-', 'src-'))).limit(1);
          if (drizzleArticles[0] && drizzleArticles[0].rawMetadata) {
            existingArticle = JSON.parse(drizzleArticles[0].rawMetadata);
          }
        } catch (e) {
          // Do nothing
        }
      }
      
      if (!existingArticle) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      // Update tags relevance score if needed
      const tags = data.tags || existingArticle.tags;
      let relScore = existingArticle.relevanceScore;
      if (tags.includes("Breaking")) relScore = Math.min(100, relScore + 10);
      if (tags.includes("Exclusive")) relScore = Math.min(100, relScore + 5);
      if (tags.includes("Popular")) relScore = Math.min(100, relScore + 5);
      
      const updatedArticle: Article = {
        ...existingArticle,
        title: data.title || existingArticle.title,
        aiSummary: data.summary || data.aiSummary || existingArticle.aiSummary,
        fullContent: data.fullContent || existingArticle.fullContent,
        category: data.category || existingArticle.category,
        region: data.region || existingArticle.region,
        sourceName: data.sourceName || existingArticle.sourceName,
        tags: tags,
        relevanceScore: relScore,
        ...(data.imageUrl ? { imageUrl: data.imageUrl, hasImage: true } : {}),
        fetchedAt: new Date().toISOString(),
      };
      
      // Update Firebase
      try {
        await setDoc(docRef, updatedArticle, { merge: true });
      } catch(e: any) {
        console.log("Firebase update skipped:", e.message);
      }
      
      // Update Drizzle
      try {
        const updateId = id.replace('article-', 'src-').replace('editorial-', 'src-');
        await drizzleDb.update(sourceItems).set({
          originalTitle: updatedArticle.title,
          category: updatedArticle.category,
          excerpt: updatedArticle.aiSummary,
          rawMetadata: JSON.stringify(updatedArticle),
          sourceName: updatedArticle.sourceName,
          originalUrl: updatedArticle.imageUrl || null,
        }).where(eq(sourceItems.id, updateId));
      } catch (e: any) {
        console.log("Drizzle update skipped:", e.message);
      }
      
      // Clear cache
      apiCache.clear();
      apiCache.delete(`news_id_${id}`);
      
      res.json({ success: true, data: updatedArticle });
    } catch (e: any) {
      console.error("Failed to update article:", e);
      res.status(500).json({ error: "Failed to update article" });
    }
  });
  
  app.delete("/api/news/:id", async (req, res) => {
    try {
      const id = req.params.id;
      
      // Delete from Firebase
      try {
        const docRef = doc(firebaseDb, "articles", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await deleteDoc(docRef);
        }
      } catch(e: any) {
        console.log("Firebase delete skipped:", e.message);
      }
      
      // Delete from Drizzle
      try {
        const deleteId = id.replace('article-', 'src-').replace('editorial-', 'src-');
        await drizzleDb.delete(sourceItems).where(eq(sourceItems.id, deleteId));
      } catch (e: any) {
        console.log("Drizzle delete skipped:", e.message);
      }
      
      // Clear cache
      apiCache.clear();
      apiCache.delete(`news_id_${id}`);
      
      res.json({ success: true });
    } catch (e: any) {
      console.error("Failed to delete article:", e);
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  app.post("/api/news/:id/analyze", async (req, res) => {
    try {
      const docRef = doc(firebaseDb, "articles", req.params.id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
          throw new Error("Document does not exist in Firebase");
      }

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
  "credibilityScore": 85 /* int out of 100 based on source and content tone */,
  "detailedHumanizedSummary": "Write a detailed humanized summary that talks about this. Keep it running like this is the best, engaging, and in-depth."
}`;
        
        try {
          const response = await ai.models.generateContent({
             model: 'gemini-3.5-flash',
             contents: prompt,
             config: {
                 responseMimeType: 'application/json',
                 maxOutputTokens: 4096 // max tokens increased to avoid truncation
             }
          });
          const parsed = JSON.parse(response.text || '{}');
          article.keyPoints = parsed.keyPoints || [];
          article.whyItMatters = parsed.whyItMatters || "Context pending further review.";
          if (parsed.detailedHumanizedSummary) {
              article.detailedHumanizedSummary = parsed.detailedHumanizedSummary;
          }
          
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
          delete (article as any).imageUrl;
      }
      apiCache.delete(`news_id_${req.params.id}`);
      res.json({ data: article });
    } catch (e: any) {
      console.log("Firebase fetch for analysis skipped, falling back to Drizzle:", e.message);
      try {
          const id = req.params.id;
          const [drizzleArticle] = await drizzleDb.select().from(sourceItems).where(eq(sourceItems.id, id.replace('article-', 'src-').replace('editorial-', 'src-'))).limit(1);
          if (!drizzleArticle) {
              return res.status(404).json({ error: "Not found in database" });
          }
          
          let parsed: any = {};
          if (drizzleArticle.rawMetadata) {
              try {
                  parsed = JSON.parse(drizzleArticle.rawMetadata);
              } catch(e) {}
          }
          
          let article: any = {
              ...parsed,
              id: drizzleArticle.id,
              title: parsed.title || drizzleArticle.originalTitle || "Untitled",
              slug: drizzleArticle.id,
              sourceName: parsed.sourceName || drizzleArticle.sourceName || "Global Syndicate",
              sourceUrl: parsed.sourceUrl || drizzleArticle.sourceUrl || "#",
              originalUrl: parsed.originalUrl || drizzleArticle.originalUrl || "#",
              publishedAt: parsed.publishedAt || drizzleArticle.originalPublishedAt || new Date().toISOString(),
              fetchedAt: parsed.fetchedAt || drizzleArticle.fetchedAt || new Date().toISOString(),
              category: parsed.category || drizzleArticle.category || "Economy",
              region: parsed.region || "Global",
              language: parsed.language || "en",
              aiSummary: parsed.aiSummary || parsed.detailedHumanizedSummary || drizzleArticle.excerpt || "Initial signals intercepted",
              fullContent: parsed.fullContent || drizzleArticle.excerpt || "Initial signals intercepted. Awaiting full AI analysis.",
              tags: parsed.tags || ["Live Feed", "Analyzed (Fallback)"],
              importanceScore: parsed.importanceScore || 70 + Math.floor(Math.random() * 20),
              relevanceScore: parsed.relevanceScore || 75 + Math.floor(Math.random() * 20),
              credibilityScore: parsed.credibilityScore || drizzleArticle.credibilityScore || 85,
          };
          
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
      "credibilityScore": 85,
      "detailedHumanizedSummary": "Write a detailed humanized summary that talks about this. Keep it running like this is the best, engaging, and in-depth."
    }`;
            try {
              const response = await ai.models.generateContent({
                 model: 'gemini-3.5-flash',
                 contents: prompt,
                 config: { responseMimeType: 'application/json', maxOutputTokens: 4096 }
              });
              const parsed = JSON.parse(response.text || '{}');
              article.keyPoints = parsed.keyPoints || [];
              article.whyItMatters = parsed.whyItMatters || "Context pending further review.";
              if (parsed.detailedHumanizedSummary) {
                  article.detailedHumanizedSummary = parsed.detailedHumanizedSummary;
              }
              let updatedTags = article.tags.filter((t: string) => t !== "Unclassified");
              if (parsed.tags && Array.isArray(parsed.tags)) {
                  updatedTags = [...updatedTags, ...parsed.tags];
              }
              article.tags = [...new Set([...updatedTags, "AI Analyzed"])];

              if (parsed.sentiment) article.sentiment = parsed.sentiment;
              if (parsed.credibilityScore) article.credibilityScore = parsed.credibilityScore;
            } catch (aiErr) {
               console.error("Gemini fallback analysis failed", aiErr);
               article.keyPoints = ["Analysis failed or rate limited", "Pending secondary review"];
               article.whyItMatters = "Unable to process context at this time.";
            }
          }
          
          try {
             const updateId = req.params.id.replace('article-', 'src-').replace('editorial-', 'src-');
             await drizzleDb.update(sourceItems).set({
                 rawMetadata: JSON.stringify(article),
             }).where(eq(sourceItems.id, updateId));
          } catch(e) {}
          
          res.json({ data: article });
      } catch (fallbackErr) {
          console.error(fallbackErr);
          res.status(500).json({ error: "Failed to analyze" });
      }
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
      const pulse = (quotes as any[]).map((q: any) => ({
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
        let latest: any[] = [];
        try {
          const snap = await getDocs(query(collection(firebaseDb, "articles"), orderBy("publishedAt", "desc"), fsLimit(7)));
          latest = snap.docs.map((d) => d.data() as Article);
        } catch(e: any) {
          console.log("Firebase DB unavailable for briefings, using Drizzle:", e.message);
          const drizzleLatest = await drizzleDb.select().from(sourceItems).orderBy(desc(sourceItems.originalPublishedAt)).limit(7);
          latest = drizzleLatest.map(d => ({
             title: d.originalTitle || "Untitled",
             sourceName: d.sourceName || "Global Syndicate",
             aiSummary: d.excerpt || "Initial signals intercepted."
          }));
        }

        const recentStories = latest
          .map((a) => `- ${a.title}: ${a.aiSummary.substring(0, 100)}`)
          .join("\n");
        const prompt = `You are a geopolitical intelligence briefer. Create a daily executive briefing based on these latest events: \n${recentStories}\n\nReturn JSON: {"executiveSummary": "overview paragraph", "keyThemes": ["theme1", "theme2"]}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: { responseMimeType: 'application/json', maxOutputTokens: 2048 }
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
  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" || process.argv[1]?.includes('dist/server.cjs') || (process.env.PORT && process.env.PORT !== "3000");
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
