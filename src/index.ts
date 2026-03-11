#!/usr/bin/env node

import { runApp } from "./app.js";
import { runConfigCommand } from "./prompts.js";

const command = process.argv[2];

if (command === "config") {
  void runConfigCommand();
} else {
  void runApp();
}
