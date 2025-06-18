import mongoose, {isValidObjectId, sanitizeFilter} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const allowedSortFields = ["views", "createdAt", "duration", "title"];

const deleteFromCloudinary = async(url, resourceType = "video") => {
  
  try {  
    const publicId = url.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  
} catch (error) {
  console.error(`Failed to delete ${resourceType} from Cloudinary:`, error);
}}

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    throw new ApiError(400, "Invalid page number");
  }
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ApiError(400, "Limit must be between 1 and 100");
  }
  if (sortBy && !allowedSortFields.includes(sortBy)) {
    throw new ApiError(400, "Invalid sort field");
  }
  const sortOrder = sortType === "asc" ? 1 : -1;

  const searchQuery = query?.trim()
    ? query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    : null;


  if (userId && !mongoose.isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const matchStage = { isPublished: true }; 

  if (searchQuery) {
    matchStage.$or = [
      { title: { $regex: searchQuery, $options: "i" } },
      { description: { $regex: searchQuery, $options: "i" } },
    ];
  }

  if (userId) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }


  const sortStage = { [sortBy]: sortOrder };

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" }, 
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        updatedAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.fullName": 1,
        "owner.avatar": 1,
      },
    },
    { $sort: sortStage },
  ];


  const options = {
    page: pageNum,
    limit: limitNum,
  };


  const result = await Video.aggregatePaginate(pipeline, options);

  
  if (!result.docs.length) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { videos: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 }, "No videos found")
      );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          videos: result.docs,
          total: result.totalDocs,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        "Videos fetched successfully"
      )
    );
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, } = req.body

    if([title,description,thumbnail].some((fields) => fields?.trim()==="")){
        throw new ApiError("All fields are required")
    }

    videoLocalPath = req.files?.video[0]?.path
    if(!videoLocalPath){
        throw new ApiError("video file is required")
    }

    thumbnailLocalPath = req.file?.thumbnail[0]?.path
    if(!thumbnailLocalPath){
        throw new ApiError("thumbnail file is required")
    }

    const video = await uploadOnCloudinary(videoLocalPath)

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!video?.url){
        throw new ApiError("faile to upload video " )
    }

    if(!thumbnail?.url){
        throw new ApiError(" failed to upload thumbnail ")
    }

    const uploaded = await Video.create({
        owner : req.user._id,
        title,
        description,
        video : video.url,
        thumbnail : thumbnail.url,
        duration : video.duration
    })

    if(!uploaded){
        throw new ApiError("Something went wrong")
    }

    return res
    .status(200)
    .json( new ApiResponse(200,uploaded,"video uploaded successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    

    if(!videoId || !mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

    const video = await Video.aggregate([

        {
            $match : { id: new mongoose.Types.ObjectId(videoId)}
        },
        {
            $lookup:{ 
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "uploadedBy"
            }
        },
        {
            $unwind : "uploadedBy"
        },
        {
            $lookup : {
                from : "likes",
                localField: "_id",
                foreignField: "video",
                as : "likes"
            }

        },
        {
            $addFields: {
                totalLikes: {
                  $size : "$likes"
                }, 
                isLikes : {
                    $cond: {
                        if: {$in : [req.user._id,"$likes.likedBy"]},
                        then: true,
                        else : false
                    }
                }

            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                totalSubscribers : {
                    $size : "$subscribers"
                },
                isSubscribe : {
                    $cond: {
                        if:{$in: [req.user._id,"subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project : {
                title : 1,
                description: 1,
                views: 1,
                thumbnail: 1,
                videoFile: 1,
                uploadeBy: {
                    fullName : 1,
                    username: 1,
                    avatar: 1,
                },
                totalLikes: 1,
                 isLikes: 1,
                 totalSubscribers: 1,
                  isSubscribe: 1
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, "video fetch"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description,} = req.body

       if(!videoId || !mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

    thumbnailLocalPath = req.file?.path

    if(!title || !description || ! thumbnailLocalPath){
      throw new ApiError(400, "All fields are required")
    }

    thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail.url){
      throw new ApiError(400,"thumbnail is not uploaded")
    }

    const update = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
          thumbnail : thumbnail.url
        }
      },
      {new : true}
    )

    return res
    .status(200)
    .json(200, "update video details successfully")
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

      if(!videoId || !mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }
     const video = Video.findOne({
      id: videoId,
      owner: req.user._id,
     })

     if(!video){
      throw new ApiError(400, "video not found")
     }

     await deleteFromCloudinary(video.videoFile, "video");
     await deleteFromCloudinary(video.thumbnail, "image");

     await Video.deleteOne({ video: videoId})

     await Like.deleteMany({video: videoId})
     await Comment.deleteMany({video: videoId})

     await User.updateMany(
      { 
        watchHistory : videoId
      },
      {
        $pull :  { 
        watchHistory : videoId
      },
      }
     )

     return res
     .status(200)
     .json(new ApiResponse(400,{},"deleted successfully"))
  
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

     if(!videoId || !mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video Id")
    }

    const video = await Video.findOne({
    _id: videoId,
    owner: req.user._id, 
  });

  if (!video) {
    throw new ApiError(404, "Video not found or you are not authorized to modify it");
  }

    const updatedVideo = await Video.findOneAndUpdate(
      {
        id: videoId,
        owner: req.user._id
      },
      {$set : {
       isPublished: !video.isPublished
      }},
      {
        new: true,
        select: "thumbnail, title, videoFile, isPublished, owner, createdAt",
      }
    )
    if(!updatedVideo){
       throw new ApiError(400,"failed to toggle publish status")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo,`Video ${updatedVideo.isPublished ? "published" : "unpublished"} successfully`))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}