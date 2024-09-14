import Post from "../models/post.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../middlewares/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPost = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const { description } = req.body;
  const image = req.file;

  if (!(description || image)) throw new ApiError(400, "Post cannot be empty");
  const imagePath = image?.path;
  let imageUrl;
  if (imagePath) {
    imageUrl = await uploadOnCloudinary(imagePath);

    if (!imageUrl.url) throw new ApiError(400, "Cloudinary error");
  }

  const postData = {};
  if (imageUrl) {
    postData.image = imageUrl?.url;
  }
  if (description) {
    postData.description = description;
  }
  if (userId) {
    postData.postedBy = userId;
  }

  const post = await Post.create(postData);

  if (!post) throw new ApiError(400, "post is not created");

  res.status(201).json(new ApiResponse(201, post, "successfully posted"));
});

export { createPost };
