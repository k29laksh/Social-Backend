import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

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


  
  const newUser= await User.findById(user._id).select("-password -refreshToken")
  if(!newUser)
    throw new ApiError(400,"error during creating user")
  return res.status(201).json(
    new ApiResponse(200, newUser,"you have successfully singed up")
  )
});

export { UserSignup };
