import { Router } from "express";
import {loginUser, logoutUser, refreshAccessToken, registerUser,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar, updateUserCoverImage , getUserChannelProfile, getWatchHistory} from "../controllers/user.controller.js"
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

router.route.apply("/refreh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/get-current-user").get( verifyJWT,getCurrentUser)

router.route("/update-account-details").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(   verifyJWT, upload.single("avatar"),  updateUserAvatar)

router.route("/cover-Image").patch(   verifyJWT, upload.single("coverImage") ,updateUserCoverImage)

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);

router.route("/watch-history").get(verifyJWT,getWatchHistory)


export default router