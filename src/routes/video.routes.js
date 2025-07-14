import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import {ApiError} from "../utils/ApiError.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus} from "../controllers/video.controller.js"


const router = Router()

router.route("/")
     
    .get(getAllVideos)
    .post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), publishAVideo)

router.use(verifyJWT)

router
    .route("/:videoId")
    .get( getVideoById)
    .delete( deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo)

router.route("/:videoId/toggle").patch(togglePublishStatus)

export default router