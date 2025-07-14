import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {Tweet, Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!videoId || !mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Provide a valid video ID")
    }

    if (!req.user?._id || !mongoose.isValidObjectId(req.user._id)) {
    throw new ApiError(401, "Unauthorized: Invalid user");
  }

   const video = await Video.findById({ video: videoId})
   if(!video){
    throw new ApiError(400, "video is not published")
   }
    
    const ifLiked = await Like.findOne({video : videoId, likedBy : req.user._id})

    if (!ifLiked) {
        
            await Like.create({ video: videoId, likedBy: req.user._id})

            return res
            .status(201)
            .json( new ApiResponse(201, { videoId }, "Video liked successfully"))
      
    } else {
       
            await Like.findOneAndDelete({ video: videoId, likedBy: req.user._id})

            return res
            .status(200)
            .json(200,{ videoId }, " video unliked successfully")
       
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    
    if(!commentId || !mongoose.isValidObjectId(commentId)){
        throw new ApiError(500," Provide a valid comment ID")
    }
     if (!req.user?._id || !mongoose.isValidObjectId(req.user._id)) {
    throw new ApiError(401, "Unauthorized: Invalid user");
  }

   const comment = await Comment.findById({ Comment: commentId})
   if(!comment){
    throw new ApiError(400, "comment is not published")
   }

    const isLiked = await Comment.findOne({Comment: commentId, likedBy : req.user._id})
    
    if(!isLiked){
        
            await Comment.create({Comment: commentId, likedBy : req.user._id})

            return res
            .status(200)
            .json( new ApiResponse(200,{ commentId }, "comment liked successfully"))
        
    }
    else{
       
            await Comment.findOneAndDelete({Comment: commentId, likedBy : req.user._id})

            return res
            .status(200)
            .json( new ApiResponse(200, { commentId }, "comment unliked successfully"))
        
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!tweetId || !mongoose.isValidObjectId(tweetId)){
        throw new ApiError(500,"Provide a valid tweet ID")
    }

    if (!req.user?._id || !mongoose.isValidObjectId(req.user._id)) {
    throw new ApiError(401, "Unauthorized: Invalid user");
  }

   const tweet = await Tweet.findById({ tweet : tweetId})
   if(!tweet){
    throw new ApiError(400, "tweet is not published")
   }

  

    const isLiked = await Tweet.findOne({tweet : tweetId, likedBy : req.user._id})
    
    if(!isLiked){
       
            await Tweet.create({tweet : tweetId, likedBy : req.user._id})

            return res
            .status(200)
            .json( new ApiResponse(200,{ tweetId }, "Tweet liked successfully"))
       
    }
    else{
       
            await Comment.findOneAndDelete({tweet : tweetId, likedBy : req.user._id})

            return res
            .status(200)
            .json( new ApiResponse(200,{ tweetId }, "tweet unliked successfully"))
       
    }
   
}
)

const getLikedVideos = asyncHandler(async (req, res) => {

         const {page = 1, limit = 10} = req.query
    
    if(!req.user?._id || !mongoose.isValidObjectId(req.user._id)){
        throw new ApiError(401,"Invalid user")
    }

    const pageNum = Math.max(1 , parseInt(page) || 1)
    const limitNum = Math.max(1, parseInt(limit) || 10)

    const likedVideos = await Like.aggregate([
        {
            $match : {likedBy : new mongoose.Types.ObjectId(req.user._id)}
        },
        {
            $lookup : {
                from : "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
            }
        },
        {
            $unwind: "$video"
        },
        {
            $lookup: {
                from : "users",
                localField: "video.owner",
                foreignField:"_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                title: "$video.title",
                thumbnail : "$video.thumbnail",
                videoFile: "$video.videoFile",
                description : "$video.description",
                duration : "$video.duration",
                views : "$video.views",
                owner : {
                    fullName : "$owner.fullName",
                    username : "$owner.username",
                    avatar : "$owner.avatar",
                }

            }
        },
        {
            $sort : {createdAt: -1}
        },
        {
            $skip : (pageNum -1)*limitNum
        },
        {
            $limit : limitNum
        },

       
    ])

    const totalVideosLike = await Like.countDocuments({likedBy : req.user._id , video : {$exists : true}})

    return res
    .status(200)
    .json(new ApiResponse(200,{  videos : likedVideos , totalVideosLike, page : pageNum , limit : limitNum },  likedVideos.length  ? "All liked video fetch successfully" : "Video not liked"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}