import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadOnCloudinary } from "../middlewares/cloudinary.js";
import Follow from "../models/follow.model.js";
import mongoose from "mongoose";

const generateToken = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const UserSignup = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if ([name, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({
    name,
    email,
    username,
    password,
  });

  const newUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!newUser) throw new ApiError(400, "error during creating user");
  return res
    .status(201)
    .json(new ApiResponse(200, newUser, "you have successfully singed up"));
});

const UserLogin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email)
    throw new ApiError(400, "username or email is required");

  if (!password) throw new ApiError(400, "password is required");

  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) throw new ApiError(400, "Email or Username not found");

  const passwordIsCorrect = await user.checkPassword(password);
  if (!passwordIsCorrect) throw new ApiError(400, "Password is incorrect");

  const { accessToken, refreshToken } = await generateToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { loggedInUser, accessToken },
        "user logged in successfully"
      )
    );
});

const UserLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});






const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, bio, location } = req.body;
  const image = req.files?.image;
  const coverImage = req.files?.coverImage;

  let avatar, coverAvatar;
  console.log(image, coverImage);

  if (image[0]?.path) {
    avatar = await uploadOnCloudinary(image[0].path);
    console.log(avatar);

    if (!avatar.url) {
      throw new ApiError(400, "Error while uploading avatar");
    }
  }

  if (coverImage[0]?.path) {
    coverAvatar = await uploadOnCloudinary(coverImage[0].path);
    console.log(coverAvatar);
    if (!coverAvatar.url) {
      throw new ApiError(400, "Error while uploading cover image");
    }
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (bio) updateData.bio = bio;
  if (location) updateData.location = location;
  if (avatar?.url) updateData.image = avatar.url;
  if (coverAvatar?.url) updateData.coverImage = coverAvatar.url;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  ).select("-password");

  if (!user) throw new ApiError(400, "User not found");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "user updated successfully"));
});





const getUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) throw new ApiError(400, "user not found");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(400, "user not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});










const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  if (!users) throw new ApiError(400, "somthing went wrong");

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});





const followUser = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const  userId  = req.user?._id;

  if (!username?.trim()) throw new ApiError(400, "Username not provided");

  const followUser = await User.findOne({ username });
  if (!followUser) throw new ApiError(400, "User not found");

  const followUserId = new mongoose.Types.ObjectId(followUser._id);
  
  if (followUserId.equals(userId)) throw new ApiError(400, "You cannot follow yourself");

  const existingFollow = await Follow.findOne({
    follower: userId,
    following: followUserId,
  });

  if (existingFollow) {
    throw new ApiError(400, `You are already following ${username}`);
  }
 
  
  const newFollow = new Follow({
    follower: userId,
    following: followUserId,
  });
  
  await newFollow.save();

  

  return res
    .status(200)
    .json(new ApiResponse(200, `You are now following ${username}`, newFollow));
});












const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const  userId  = req.user?._id; 

  const profile = await User.aggregate([
    { $match: { username: username?.toLowerCase() } },

    // Lookup followers
    {
      $lookup: {
        from: "follows",
        localField: "_id",         // User's _id in User collection
        foreignField: "following", // Following field in Follow collection
        as: "followers",
      },
    },

    // Lookup followings
    {
      $lookup: {
        from: "follows",
        localField: "_id",        // User's _id in User collection
        foreignField: "follower", // Follower field in Follow collection
        as: "followings",
      },
    },
    
    //  total counts and isFollowing field
    {
      $addFields: {
        totalFollowers: { $size: "$followers" },
        totalFollowings: { $size: "$followings" },
        isFollowing: {
          $cond: {
            if: { $in: [new mongoose.Types.ObjectId(userId), "$followers.follower"] },
            then: true,
            else: false,
          },
        },
      },
    },
    
    // Project relevant fields
    {
      $project: {
        name: 1,
        username: 1,
        image: 1,
        coverImage: 1,
        bio: 1,
        location: 1,
        totalFollowers: 1,
        totalFollowings: 1,
        isFollowing: 1,
      },
    },
  ]);

  // If profile not found
  if (!profile?.length) {
    throw new ApiError(400, "Profile doesn't exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, profile[0], "Profile fetched successfully"));
});


const getUserFollowings = asyncHandler(async (req, res) => {
  const {username}=req.params;
  if (!username?.trim()) throw new ApiError(400, "Username not provided");

  const user = await User.findOne({ username });
  if (!user) throw new ApiError(400, "User not found");
 
  const userId = new mongoose.Types.ObjectId(user?._id);
  
  const followings = await Follow.find({ follower: userId })
    .populate({
      path: "following", 
      select: "name username image", 
    }).select("-follower");

  if (!followings.length) {
    throw new ApiError(404, "No followings found for this user");
  }

  return res.status(200).json(
    new ApiResponse(200, followings, "Followings fetched successfully")
  );
});


const getUserFollowers = asyncHandler(async (req, res) => {
  const {username}=req.params;
  if (!username?.trim()) throw new ApiError(400, "Username not provided");

  const user = await User.findOne({ username });
  if (!user) throw new ApiError(400, "User not found");
 
  const userId = new mongoose.Types.ObjectId(user?._id); 

  
  const followers = await Follow.find({ following: userId })
    .populate({
      path: "follower", 
      select: "name username image", 
    }).select("-following");

  if (!followers.length) {
    throw new ApiError(404, "No followers found for this user");
  }

  return res.status(200).json(
    new ApiResponse(200, followers, "Followers fetched successfully")
  );
});


export {
  UserSignup,
  UserLogin,
  UserLogout,
  getUser,
  updateProfile,
  getAllUsers,
  followUser,
  getUserProfile,
  getUserFollowings,
  getUserFollowers
};
