import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    image: {
      type: String,
    },
    description: {
      type: String,
    },

    postedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
  },
  { timestamps: true }
);

const Post= mongoose.model("Post",postSchema);

export default Post;
