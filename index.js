const express = require('express');
const cors = require('cors');
const { PrismaClient } = require ('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

/* GET all books */
app.get('/books', async (req, res) => {
    try {
        const books = await prisma.book.findMany({include: { publisher: true}});
        res.json(books);
    } catch (error) {
        res.status(500).json({error: "Something went wrong" });
    }
});

/*GET Single book*/
app.get('/books/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const book = await prisma.book.findUnique({
            where: { id },
            include: { publisher: true }
        });
        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: "Error fetching book" });
    }
});

/*CREATE book*/
app.post('/books', async (req, res) => {
    const { title, url, description, publisherId } = req.body;
    try {
        const newBook = await prisma.book.create({
            data: {
                title, 
                url,
                description,
                publisherId
            }
        });
        res.status(200).json(newBook);
    } catch (error) {
        res.status(500).json({ error: "Error creating book"})
    }
});

/*DELET book */
app.delete('/books/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        await prisma.book.delete({
            where: { id }
        });
        res.json({ message: "Book delete" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting book" });
    }
});
/*PATCH = Update only what you send */
/* PATCH /books/1 */
app.patch('/books/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, url, description, publisherId } = req.body;

    try {
        const updatedBook = await prisma.book.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(url && { url }),
                ...(description && { description }),
                ...(publisherId && { publisherId })
            }
        });
        res.json(updatedBook);
    } catch (error) {
        res.status(500).json({ error: " Error updating book" });
    }
});

/*PUT*/
/*
PUT /books/1 {
 "title": "New",
 "url": "new.jpg",
 "description": "new desc"
 "publischerId": 2
 */

app.put('/books/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, url, description, publisherId } = req.body;
    try {
        const updatedBook = await prisma.book.update({
            where: { id },
            data: { title, url, description, publisherId }
        }); 
        res.json(updatedBook);
    } catch (error) {
        res.status(500).json({ error: "Error replacing book" });
    }
});

// Updating the book endpoints to support Search by title, Filter by Publisher

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
