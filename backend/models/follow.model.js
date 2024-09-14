import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    following: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }, { strict: true });  // Ensures only schema-defined fields are saved
  

const Follow = mongoose.model("Follow", followSchema);
export default Follow;
