import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

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
       { loggedInUser,
        accessToken,},
        "user logged in successfully"
      )
    );
});

const UserLogout= asyncHandler(async(req,res)=>
{
  await User.findByIdAndUpdate(
    req.user._id,
    {
        $unset: {
            refreshToken: 1 // this removes the field from document
        }
    },
    {
        new: true
    }
)

const options = {
    httpOnly: true,
    secure: true
}

return res
.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken", options)
.json(new ApiResponse(200, {}, "User logged Out"))})


const updateProfile=asyncHandler(async(req,res)=>
{
     const {name,bio,location}=req.body;

    const {image,coverImage}=req.files;

       

})


export { UserSignup, UserLogin ,UserLogout};


