import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {  createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet} from "../controllers/tweet.controller.js"

const router = Router()

router.use(verifyJWT)

router
      .route("/").post(createTweet)
      .route("/user/:userId").get(getUserTweets)
      .route("/:tweetId").delete(deleteTweet).patch(updateTweet)

export default router