import {createBrowserRouter} from "react-router";
import Login from "./features/auth/pages/Login.jsx"
import Register from "./features/auth/pages/Register.jsx"
import Protected from "./features/auth/components/Protected";

export const router = createBrowserRouter([
    {
        path:'/login',
        element:<Login/>
    },{
        path:"/register",
        element:<Register/>
    },
    {
        path:'/',
         element: <Protected><h1>home page </h1></Protected>
    }
])