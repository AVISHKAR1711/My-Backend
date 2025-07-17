import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
  
    if(!channelId || !mongoose.isValidObjectId(channelId)){
        throw new ApiError(400,"Provide valid channel Id")
    }

     if (!req.user?._id || !mongoose.isValidObjectId(req.user._id)) {
        throw new ApiError(401, "Unauthorized: Invalid user");
      } 

    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(400,"channel does not exist")
    }

    const isExist = await Subscription.findOne({channel : channelId , subscriber : req.user._id})

    if(!isExist){
        await Subscription.create({channel : channelId , subscriber : req.user._id})

        return res
        .status(201)
        .json(new ApiResponse(201,{channelId}, "channel subscribed successfully"))
    } else {
        await Subscription.findOneAndDelete({channel : channelId , subscribe : req.user._id})
        return res
        .status(201)
        .json(new ApiResponse(201,{channelId}, "channel unsubscribed successfully"))
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId || !mongoose.isValidObjectId(channelId)){
        throw new ApiError(400,"Provide valid channel Id")
    }
    
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404,"channel does not exist")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match : {channel : new mongoose.Types.ObjectId(channelId)}
        },
        {
            $lookup : {
                from : "users",
                foreignField: "_id",
                localField:"subscriber",
                as: "subscribers"
            }
        },
        {
            $unwind : "$subscribers"
        },
        {
            $project : {
                _id : "subscribers._id",
                fullName : "subscribers.fullName",
                username : "subscribers.username",
                avatar : "subscribers.avatar"
            }
            
      
        }
    ])

    const totalSubscriber = await Subscription.countDocuments({channel : channelId});


    return res
    .status(200)
    .json(new ApiResponse(201,{totalSubscriber,subscribers},subscribers.length ?"subscribers fetched successfully" : "subscriber not found"))

})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId || !mongoose.isValidObjectId(channelId)){
        throw new ApiError(404,"Provide valid channel Id")
    }

    const user = await User.findById(subscriberId)

    if(!user){
        throw new ApiError(400,"the user is not exist")
    }

    const subscribedChannel = await Subscription.aggregate([
        {
            $match : { subscriber : new mongoose.Types.ObjectId(subscriberId)}
        },
        {
            $lookup: {
                from : "users",
                localField: "channel",
                foreignField: "_id",
                as : "channels"
            }
        },
        {
            $unwind : "$channels"
        },
        {
            $project : {
                  _id : "channels._id",
                  username : "channels.username",
                  fullName : "channels.fullName",
                  avatar : "channels.avatar"
                }
            }
        
    ])

    const totalSubscribedChannel = Subscription.countDocuments({channel : channelId})

    return res
    .status(200)
    .json(new ApiResponse(201, {subscribedChannel,totalSubscribedChannel},subscribedChannel.length ? "subscribe channel fetched successfully " :"the user have not subscribed any channel"))
    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}