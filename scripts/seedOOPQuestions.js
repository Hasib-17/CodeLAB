const mongoose = require('mongoose');
const { CSTestAnswer } = require('../models/CSTestAnswer.js');

// Replace with your Atlas URI or use process.env.MONGODB_URI
const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
    await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const questions = [
        { question: "What does OOP stand for?", correct_answer: "Object Oriented Programming" },
        { question: "Name the four main principles of OOP.", correct_answer: "Encapsulation, Abstraction, Inheritance, Polymorphism" },
        { question: "What is encapsulation?", correct_answer: "Binding data and methods together" },
        { question: "What is inheritance?", correct_answer: "Acquiring properties from another class" },
        { question: "What is polymorphism?", correct_answer: "Ability to take many forms" },
        { question: "What is abstraction?", correct_answer: "Hiding internal details and showing essential features" },
        { question: "What keyword is used to create a class in Java?", correct_answer: "class" },
        { question: "What is the base class for all classes in Java?", correct_answer: "Object" },
        { question: "What is method overloading?", correct_answer: "Same method name, different parameters" },
        { question: "What is method overriding?", correct_answer: "Subclass redefines superclass method" },
    ];

    await CSTestAnswer.deleteMany(); // remove existing if any
    await CSTestAnswer.insertMany(questions);
    console.log('✅ Seed completed!');
    mongoose.connection.close();
}

seed().catch(err => {
    console.error(err);
    mongoose.connection.close();
});
