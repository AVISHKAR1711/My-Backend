import { Router } from "express";
import {loginUser, logoutUser, refrehAccessToken, registerUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import {ApiError} from "../utils/ApiError.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
          name: "avatar"
        },
        {
          name:"coverImage"
        }
      ]
    ),
    registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post( verifyJWT,logoutUser)

router.route.apply("/refreh-token").post(refrehAccessToken)

export default router