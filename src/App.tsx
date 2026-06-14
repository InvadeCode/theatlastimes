/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ArticleView from './pages/ArticleView';
import Preferences from './pages/Preferences';
import Feed from './pages/Feed';
import NewNews from './pages/NewNews';
import Archives from './pages/Archives';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="article/:id" element={<ArticleView />} />
          <Route path="category/:id" element={<Feed />} />
          <Route path="region/:id" element={<Feed />} />
          <Route path="preferences" element={<Preferences />} />
          <Route path="new-news" element={<NewNews />} />
          <Route path="archives" element={<Archives />} />
          <Route path="*" element={<div className="p-10 text-center py-20 text-muted-foreground"><h1 className="text-2xl font-serif mb-4">404 - Document Not Found</h1><p>The requested bulletin could not be located.</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
