import mongoose, { Aggregate } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import {Like} from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId || !mongoose.isValidObjectId(videoId)) 
    {
        throw new ApiError(404, "Provide valid video id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "video not found")
    }


    const comments = await Comment.aggregate([
        {
            $match : {video : new mongoose.Types.ObjectId(videoId)}
        },
        {
            $lookup : {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",

                pipeline: [
                    {
                        $project : {
                            avatar : 1,
                            username : 1,
                            fullName : 1,
                        }
                    }
                ]
            }
        },
        {
             $unwind: "$owner" 
        },
        {
            $lookup : {
                from : "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }

        },
        {
            $addFields: {
                likes : {
                    $size : "$likes"
                }
            }
        },
        {
            $project: {
                fullName: 1,
                avatar: 1,
                username: 1,
                content : 1,
                likes : 1
            }
        },
        {
            $skip: (page - 1)*limit
        },
        {
            $limit : parseInt(limit)
        }
    ])

    const totalComments = await Comment.countDocuments({video : videoId}) 

    if(!comments.length){
        throw new ApiError(404, "No comments on video")
    }

    return res
    .status(200)
    .json( new ApiResponse(200, {comments,totalComments},  "comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body

    if(!videoId || !mongoose.isValidObjectId(videoId) || ! content){
        throw new ApiError("provide valid videoId and content")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })
    if(!comment){
        throw new ApiError(404, "something went wrong when you commenting")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment is added"))
})

const updateComment = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {commentId} = req.params

    if(!content.trim()){
        throw new ApiError(404,"provide content")
    }

    if(!commentId || !mongoose.isValidObjectId(commentId)){
        throw new ApiError(404,"provide commentId")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "can not find comment")
    }

    if(comment.owner.equals(req.body._id)){
        throw new ApiError(400, "you have not owner of this comment")
    }

    const toUpdateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set : {
                content : content.trim()
            }
        },
        {
            new : true,
            select: "content owner video createdAt",
        }
    )

    if(!toUpdateComment){
        throw new ApiError(404,"the comment is not updated")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,toUpdateComment,"the comment is updated"))

})

const deleteComment = asyncHandler(async (req, res) => {
     const {commentId} = req.params

      if(!commentId || !mongoose.isValidObjectId(commentId)){
        throw new ApiError(404,"provide commentId")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"the video comment is not found")
    }

    const deleteComment = await Comment.findOneAndDelete(commentId)

    if(!deleteComment){
        throw new ApiError(400,"the comment is not deleted")
    }

    await Like.deleteMany({comment : commentId})

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "the comment is deleted"))



})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }