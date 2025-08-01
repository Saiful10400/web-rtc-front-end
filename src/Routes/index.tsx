import { Route } from "react-router";
import Root from "../Components/Root";
import Home from "../Components/Home/Home";
import OnlineUser from "../Components/OnlineUser/OnlineUser";

const routes = (
  <>
    <Route path="/" element={<Root />}>
      <Route index element={<Home />} />
      <Route path="online-user" element={<OnlineUser/>} />
    </Route>
  </>
);

export default routes;
