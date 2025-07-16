import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo";
import UsbLog from "@/models/UsbLog";       // ✅ import UsbLog
import bcrypt from "bcrypt";
import dbConnect from '@/utils/dbConnect';

export async function POST(req) {
  const body = await req.json();
  await dbConnect();

  const pass = body.password;
  if (!pass?.length || pass.length < 5) {
    return new Response(JSON.stringify({ error: 'Password must be at least 5 characters' }), { status: 400 });
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  body.password = bcrypt.hashSync(pass, salt);

  // Create userInfo
  const userInfo = new UserInfo();
  const userInfod = await userInfo.save()
  body.userInfo = userInfod._id

  // Create user
  const createdUser = await User.create(body);

  // ✅ Clear USB logs for this user (new studentId)
  await UsbLog.deleteMany({ studentId: createdUser._id });

  return Response.json(createdUser);
}
