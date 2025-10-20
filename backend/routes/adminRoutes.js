import express from "express";
import { adminModel } from "../models/adminModel.js";
import sanitizeHtml from "sanitize-html";

const router = express.Router();
router.post('/create', async (request,response)=>{
    try {
        if(
            !request.body.email||
            !request.body.password
        ){
            return response.status(400).send({message: 'Send all the required fields'});
        }

        const newAdmin = {
            email: sanitizeHtml(request.body.email),
            password: sanitizeHtml(request.body.password)
        }

        const newAdminFinal = await adminModel.create(newAdmin);
        return response.status(201).json({message: 'Admin created successfully', email: newAdminFinal.email});
    } catch (error) {
        return response.status(500).json({message: 'Failed to create admin'});
    }
})

router.post('/login', async (request,response)=>{
    try {
        const {email, password} = request.body;

        const user = await adminModel.findOne({email: email});
        
        if(user && user.password === password){
            response.json({success: "Success", user: user.email});
        } else {
            response.status(401).json({message: "Invalid credentials"});
        }
    } catch (error) {
        response.status(500).json({message: "Authentication failed"});
    }
});


export default router;
