import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // ADD THIS
import { Game, User } from "../models/index.js";

const router = express.Router();

// ✅ FIXED: Query by _id (MongoDB ObjectId)
router.post("/admin/create-team", async (req, res) => {
  try {
    const { game_id, team_name, password } = req.body;
    const game = await Game.findById(game_id);
    
    if (!game) {
      return res.status(400).json({ message: "Game not found" });
    }

    const teamCount = await User.countDocuments({
      game_id: game._id.toString(), 
      role: "STUDENT",
    });

    if (teamCount >= game.number_of_teams) {
      // ✅ Use correct field name
      return res
        .status(400)
        .json({ message: `Maximum ${game.number_of_teams} teams allowed` });
    }

    // ✅ Check existing team by team_id + game_id
    const existingTeam = await User.findOne({
      game_id: game._id.toString(),
      team_id: team_name.toUpperCase(),
    });

    if (existingTeam) {
      return res.status(400).json({ message: "Team already exists" });
    }

    // ✅ Store plain_password for admin UI
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      username: team_name.toUpperCase(),
      password: hashedPassword, // Pre-hashed to bypass pre-save
      plain_password: password, // ✅ For admin display
      team_id: team_name.toUpperCase(),
      role: "STUDENT",
      game_id: game._id.toString(), // ✅ Store game's _id as string
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      user: {
        username: user.username,
        team_id: user.team_id,
      },
    });
  } catch (error) {
    console.error("Create team error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// STUDENT LOGIN - ✅ FIXED
router.post("/student-login", async (req, res) => {
  try {
    const { game_id, team_name, password } = req.body;

    const user = await User.findOne({
      game_id: game_id.toLowerCase(),
      team_id: team_name,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Game ID or Team Name",
      });
    }

    // ✅ USE BCRYPT COMPARE
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        teamId: user.team_id,
        role: user.role || "STUDENT",
        gameId: user.game_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        username: user.username || user.team_id,
        team_id: user.team_id,
        role: user.role || "STUDENT",
        game_id: user.game_id,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN LOGIN - ✅ FIXED
router.post("/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Admin login attempt:", { username, password: "***" });

    const user = await User.findOne({
      username,
      role: "ADMIN",
    });

    console.log("Found user:", user ? user.username : "NOT FOUND");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Admin user not found",
      });
    }

    // ✅ USE BCRYPT COMPARE
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log("Password mismatch");
      return res.status(401).json({
        success: false,
        message: "Invalid admin password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
