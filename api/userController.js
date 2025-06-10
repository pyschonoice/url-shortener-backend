
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { userModel, storeModel } = require("../db");
const { z } = require("zod");

const JWT_KEY = process.env.JWT_KEY;

async function signup(req, res) {
  try {
    const { email, password } = req.body;
    const emailInDb = await userModel.findOne({ email });
    if (emailInDb)
      return res
        .status(403)
        .json({ message: "User already exists, please login" });

    const userSchema = z.object({
      email: z.string().min(3).max(120).email(),
      password: z.string().min(3).max(30),
    });

    const validation = userSchema.safeParse(req.body);
    if (!validation.success)
      return res.status(411).json({ message: "Incorrect inputs" });
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await userModel.create({ email, passwordHash });
    const token = jwt.sign({ id: user._id }, JWT_KEY, { expiresIn: "1d" });

    res.status(201).json({
      token,
      message: "Signed up",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

async function signin(req, res) {
  try {
    const { email , password } = req.body;
    const user = await userModel.findOne({email})
    if(!user) return res.status(404).json({ message: "User doesn't exist" });

    const validPassword = await bcrypt.compare(password,user.passwordHash);
    if(!validPassword) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, JWT_KEY, { expiresIn: "1d" });

    res.status(200).json({
      token,
      message: "Signed in",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
}

function authMiddleware (req ,res, next){
    const token = req.headers.token;
    if (!token) return res.status(401).json({ error: "No token provided" });
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid token" });
        req.userId = decoded.id;  // Attach user info to the request object
        next();
    });
}

async function userLinks(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: User ID missing" });
    }

    const data = await storeModel.find({ userId: userId });

    res.status(200).json({ data });
  } catch (error) {
    console.error("Error fetching user links:", error);
    res.status(500).json({ error: "Internal Server Error", detail: error.message });
  }
}

module.exports = {
    signup,
    signin,
    authMiddleware,
    userLinks
}