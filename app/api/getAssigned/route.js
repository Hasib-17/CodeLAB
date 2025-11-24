import { User } from "@/models/User.js";
import { UserInfo } from "@/models/UserInfo.js";
import dbConnect from "@/utils/dbConnect";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route.js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const userID = session?.user?._id;

    // ❌ No user => return error
    if (!userID) {
      return NextResponse.json(
        { error: "Unauthorized or user not logged in" },
        { status: 401 }
      );
    }

    // 🧠 Fetch User Info
    const user = await User.findById(userID);
    const userdata = await UserInfo.findById(user.userInfo).populate({
      path: "assigned",
      populate: {
        path: "peerVideo",
        populate: {
          path: "question",
        },
      },
    });

    if (!userdata) {
      return NextResponse.json(
        { error: "User information not found" },
        { status: 404 }
      );
    }

    const resData = {
      assigned: userdata.assigned,
      assignedTime: userdata.assignedTime,
    };

    return NextResponse.json(resData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
