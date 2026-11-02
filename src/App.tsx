import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import About from './pages/About';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Faq from './pages/Faq';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import OrderStatus from './pages/OrderStatus';
import ProductPage from './pages/ProductPage';
import Shop from './pages/Shop';
import Studio from './pages/Studio';
import TrackOrder from './pages/TrackOrder';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="shop" element={<Shop />} />
        {/* /shop/:slug?edit=<cartItemId> edits an item already in the cart */}
        <Route path="shop/:slug" element={<ProductPage />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        {/* /order/:id?email=... — confirmation + tracking */}
        <Route path="order/:id" element={<OrderStatus />} />
        <Route path="track" element={<TrackOrder />} />
        <Route path="about" element={<About />} />
        <Route path="faq" element={<Faq />} />
        <Route path="studio" element={<Studio />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
