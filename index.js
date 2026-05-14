const express = require('express');
const cors = require('cors');
const { PrismaClient } = require ('@prisma/client');
const { z } = require('z');  // create a validation schema, its a gatekeeper and only valid data can enter ur database

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
// A book must follow this rules b4 entering the database
//z.object means "I expect an object(JSON), with specific fields inside"
//title: z.string() -> must be string, .min(1, -> at least 1 xter long, "Title is require" -> err msg if empty) 
// { "title": "Book Name" } valid 
// {"title": ""} Invalid Err: "Title is required"
//  url: z.string().url("Invalid URL") must be string & must be a valid URL format
// {"url": "https://example.com/image.jpg"} Valid
// {"url": "not-a-url"} Err: "Invalid URL"
// description: z.string().min(5, "Description too short"), must be string & minimum 5 xter
// {"description": "Bad"} Err: "Description too short"
// PublisherId: z.number().int() Must be number, Must be an integer(no decimals)
// .parse checks for incoming req, if valid Returns clean, validated data 

/* passes validattion
{
"title": "My Book",
"url": "https://picsum.photos/200",
description: "Very nice book",
"publisherId": 1
}
*/ 
const bookSchema = z.object({
    title: z.string().min(1, "Title is required"),
    url: z.string().url("Invalid URL"),description: z.string().min(5, "Description too short"),
    publisherId: z.number().int()
});

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
/*
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
*/

// Replace your GET/ books with this:
// Updating the book endpoints to support Search by title, Filter by Publisher
// https:localhost 3000:GET /books?search=first
// GET /books?publisherId=1
// GET /books?search=first&publisherId=1 
app.get('/books', async (req, res) => {
    const { search, publisherId } = req.query;

    try {
        const books = await 
        prisma.book. findMany ({
            where: {
                AND: [
                    search
                    ? {
                        title: {
                            contains: search, 
                            mode: 'insensitive'
                        }
                    }
                    : {},
                    publisherId
                    ? {
                        publisherId:
            parseInt(publisherId)
                    }
                    : {}
                ]
            },
            include: { publisher: true }
        });
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: "Error fetching books" });
    }
});



/*CREATE book*/
app.post('/books', async (req, res) => {
    try {
        const validatedData = bookSchema.parse(req.body);
        const newBook = await prisma.book.create({
            data: validatedData
        });
        res.status(200).json(newBook);
    } catch (error) {
        res.status(500).json({ error: "Error creating book"})
    }
});

// Replacing your post route with a validation schema 

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
// Pro tip use patch cos its safer, More flexible, Less Bugs with put it can break ur DB.
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



// Add Pagination
const page = parseInt(req.query.page) || 1;
const limit = 5;

const books = await prisma.book.findMany({
    skip: (page - 1) * limit, 
    take: limit 
});

//Create REGISTER route
app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        // check if user exists 
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({
                error: "User already exists"
            });
        }
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create User
        const user = await 
        prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || "user"
            }
        });

        res.status(201).json({
            message: "User created",
            user
        });
    } catch (error) {
        res.status(500).json({
            error: "Registration failed"
        });
    }
});

// Login Endpoint

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        
        if (!user) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        // compare password
       /* const validPassword = await bcrypt.compare(
            password,
            user.password
        );
        if (!validPassword) {
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        // create token 
        const token =jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            "MY_SECRET_KEY",
            { expiresIn: "1h" }
        );
        res.json({ token });
    } catch (error) {
        res.status(500).json({
            error: "Login failed"
        });
    }
});*/

// Auth Create Middleware 
/*
function auth(req, res, next) {

    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({
            error: "No token provided"
        });
    }

    const token  = header.split(" ")[1];
    try {
        const decoded = jwt.verify(
            token,
            "MY_SECRET_KEY"
        );
        
        req.user = decoded;

        next();
    
    } catch (error) {
        res.status(401).json({
            error: "Invalid token"
        });
    }
}

*/

// Admin only middleware
/*
function adminOnly(req, res, next) {
    if(req.user.role !== "admin") {
        return res.status(403).json({
            error: "Admins only"
        });
    }

    next()
}

*/

// Only logged in users (Protect routes)
/*
app.get('/profile', auth, (req, res) => {
    res.json(req.user);
})

*/

// Only admins can create books
/*
app.post('/books', auth, adminOnly, async (req, res) => {
    const book = await prisma.book.create({
        data: req.body
    });
    res.json(book);
});

*/

// Only admins can delete

/*
app.delete('/books/:id', auth, adminOnly, async (req, res) => {
    const id = parseInt(req.params.id);

    await prisma.book.delete({
        where: { id }
    });

    res.json({
        message: "Deleted"
    });
});

*/
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
