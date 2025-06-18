import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import {ApiError} from "../utils/ApiError.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getAllVideos, publishAVideo} from "../controllers/video.controller.js"


const router = Router()

router.route("/get-all-videos").get(verifyJWT,getAllVideos)

router.route("upload-video").post(upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]),verifyJWT, publishAVideo)