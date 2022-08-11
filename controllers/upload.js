const { response } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
// import path from 'path';
// import fs from 'fs-extra';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'files/img')
    },
    filename: function (req, file, cb) {
        const original = file.originalname.replace(/[^-A-Za-z0-9-.]+/g, '');
        cb(null, `${Date.now()}-${original}`)
    }
})

const upload = multer({ storage: storage })

const uploads = upload.single('myFile')


const uploadFiles = (req, res = response) => {
    // console.log(req);
    return res.status(200).json({
        ok: true,
        file: req.file.filename
    });
}
const getFiles = (req, res = response) => {
    console.log(req);

    const url = req.params.url;
    const folder = req.params.folder;
    const pathImage = path.resolve(__dirname, `../files/${folder}/${url}`);
    console.log(pathImage);
    if (fs.existsSync(pathImage)) {
        res.sendFile(pathImage);
    } else {
        return "No existe la imagen en el servidor";
    }


}


module.exports = { uploadFiles, uploads, getFiles }