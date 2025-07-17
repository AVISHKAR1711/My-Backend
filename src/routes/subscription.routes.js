import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT)

router.
       route("/c/:channeId")
       .get(getSubscribedChannels)
       .post(toggleSubscription)

router.route("/u/:subscriberId")
      .get(getUserChannelSubscribers)

export default router