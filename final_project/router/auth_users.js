const express = require('express');
const jwt = require('jsonwebtoken');
const books = require("./booksdb.js");
const regd_users = express.Router();

var users = [];

const isValid = (username) => {
  // Check if the username is valid
  // Assuming a valid username should be at least 3 characters long
  return username.length >= 3;
};

const authenticatedUser = (username, password) => {
  // Check if the username and password match the one we have in records
  const user = users[username] === password;
  return user;
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(400).json({ message: "Invalid username" });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  
  // Generate and return JWT token for authenticated user
  const token = jwt.sign({ username: username }, "secretKey");
  req.session.user = { username: username, token: token }; // Save user credentials in session
  
  return res.status(200).json({ message: "Login successful" });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  try {
    const decoded = jwt.verify(token, "secretKey");
    const username = decoded.username;

    // Check if the user exists and is authenticated
    const user = users[username];
    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }

    // Find the book and add or modify the review
    const book = books.find((book) => book.isbn === isbn);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const review = req.query.review;
    if (!review) {
      return res.status(400).json({ message: "Review is required" });
    }

    // Check if the user already has a review for the book
    const userReviewIndex = book.reviews.findIndex((r) => r.username === username);
    if (userReviewIndex !== -1) {
      // User already has a review, modify it
      book.reviews[userReviewIndex].review = review;
      return res.status(200).json({ message: "Review modified successfully" });
    } else {
      // User doesn't have a review, add it
      book.reviews.push({ username: username, review: review });
      return res.status(200).json({ message: "Review added successfully" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
