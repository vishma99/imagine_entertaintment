import { BrowserRouter, Routes, Route } from "react-router-dom";
import Mainpage from "./page/Mainpage";
import EventCreate from "./page/CreateEvent";
import PendingEvents from "./page/Pending";
import MissingItem from "./page/MissingItem";
import Summary from "./page/Summary";
import Scan from "./page/Scan";
import AddItem from "./page/AddItem";
import ReturnItem from "./page/returnItem";

export default function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* <Route path="/navbar" element={<Navbar />} /> */}
          <Route path="/" element={<Mainpage />} />
          <Route path="/createEvent" element={<EventCreate />} />
          <Route path="/pendingEvent" element={<PendingEvents />} />
          <Route path="/missingItem" element={<MissingItem />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/additem/:eventId/:category" element={<AddItem />} />
          <Route
            path="/returnitem/:eventId/:category"
            element={<ReturnItem />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
