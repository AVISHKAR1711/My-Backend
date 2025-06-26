import mongoose, { Aggregate, isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    
    if(!content?.trim()){
        throw new ApiError(400, "provide content")
    }

    if(content?.trim().length > 100){
        throw new ApiError(400,"the tweet content must not be exceed to 100 character")
    }

    const tweet = await Tweet.create({
        content,
        owner : req.user._id
    })

    if(!tweet){
        throw new ApiError(404,"something went wrong while tweet adding in database")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"the tweet is added successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
   
    const {userId} = req.params

    const {page = 1, limit = 10} = req.query

    if(!userId || !mongoose.isValidObjectId(userId)){
        throw new ApiError(400,"provide valid userId")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(400,"user not found")
    }

    const pageNum = Math.max(1,parseInt(page))
    const limitNum = Math.max(1,parseInt(limit))

    const userTweets = await Tweet.aggregate([
        {
            $match : {owner : new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup : {
                from : "users",
                foreignField: "_id",
                localField : "owner",
                as: "ownerOfTweet",

                pipeline: [
                    {
                     $project : {
                    fullName : 1,
                    username: 1,
                    avatar: 1,
                }
            }
        ]

            },
        },
        {
            $unwind: "$ownerOfTweet"
        },
        {
            $project : {
                owner : "ownerOfTweet",
                content: 1,
            }
        },
        {
            $sort : {cretedAt : -1}
        },
        {
            $skip : (pageNum -1)*limitNum
        },
        {
            $limit : limitNum
        }
    ])

    if(!userTweets.length){
        throw new ApiError(404,"user has no tweet yet")
    }

    const totalTweets = await Tweet.countDocuments({owner: userId})

    return res
    .status(200)
    .json(new ApiResponse(200,{userTweets,totalTweets},"tweet fetched succeefully"))
  
})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {tweetId} = req.params

    if(!content?.trim()){
        throw new ApiError(404,"Please provide content")
    }

    if(!content.trim().length > 100){
         throw new ApiError(400,"the tweet content must not be exceed to 100 character")
    }

    if(!tweetId || !mongoose.isValidObjectId(tweetId)){
        throw new ApiError(404,"Please provide tweetId")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404,"can not find tweet")
    }

    if(!(tweet.owner.equals(req.user._id))){
        throw new ApiError(404,"You have not owner of this tweet")
    }

    const updateTweet = await Tweet.findOneAndUpdate(
        { 
        id: tweetId,
        owner: req.user._id
        },
        {
            $set : {
                content : content.trim()
            }
        },
        {
            new : true,
            select : "content owner createdAt updatedAt"
        }
    );

    if(!updateTweet){
        throw new ApiError(404,"error while updating the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updateTweet,"the tweet is updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    
    const {tweetId} = req.params

     if(!tweetId || !mongoose.isValidObjectId(tweetId)){
        throw new ApiError(404,"Please provide tweetId")
    }

    const tweet = await Tweet.findById(tweetId)

     if(!tweet){
        throw new ApiError(404,"tweet not found")
    }

    if(!(tweet.owner.equals(req.user._id))){
        throw new ApiError(404,"You have not owner of this tweet")
    }

    const deleteTweet = await Tweet.findOneAndDelete({id :tweetId, owner : req.user._id})

    if(!deleteTweet){
        throw new ApiError(404,"the tweet is not deleted")
    }

     await Like.deleteMany({tweet : tweetId})

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "the tweet is deleted"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}