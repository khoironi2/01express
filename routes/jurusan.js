const express = require('express');
const router = express.Router();
const path = require('path')
const fs = require('fs')
//import express validator
const {body, validationResult } = require('express-validator');
// import database
const connection = require('../config/db');

const multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname) )
    }
})

const upload = multer({storage: storage})

router.get('/', function (req, res){
    connection.query('select * from jurusan order by id_j desc', function(err, rows){
        if(err){
            return res.status(500).json({
                status: false,
                message: 'Server Failed',
            })
        }else{
            return res.status(200).json({
                status:true,
                message: 'Data Jurusan',
                data: rows
            })
        }
    })
});

router.post('/store', upload.single("gambar") , [
    //validation
    body('nama_jurusan').notEmpty(),
],(req, res) => {
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(422).json({
            error: error.array()
        });
    }
    let Data = {
        nama_jurusan: req.body.nama_jurusan,
        gambar: req.file.filename
    }
    connection.query('insert into jurusan set ?', Data, function(err, rows){
        if(err){
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            })
        }else{
            return res.status(201).json({
                status: true,
                message: 'Success..!',
                data: rows[0]
            })
        }
    })
})

router.get('/(:id)', function (req, res) {
    let id = req.params.id;
    connection.query(`select * from jurusan where id_j = ${id}`, function (err, rows) {
        if(err){
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            })
        }
        if(rows.length <=0){
            return res.status(404).json({
                status: false,
                message: 'Not Found',
            })
        }
        else{
            return res.status(200).json({
                status: true,
                message: 'Data Jurusan',
                data: rows[0]
            })
        }
    })
})

router.patch('/update/:id', upload.single("gambar"), [
    body('nama_jurusan').notEmpty()
], (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(422).json({
            error: error.array()
        });
    }

    let id = req.params.id;

    // Lakukan pengecekan apakah ada file yang diunggah
    let gambar = req.file ? req.file.filename : null;

    // Dapatkan nama file lama dari database sebelum melakukan update
    connection.query(`select * from jurusan where id_j = ${id}`, function (err, rows) {
        if (err) {
            console.error(err);
            return res.status(500).json({
                status: false,
                message: 'Server Cek data lama Error',
            });
        }

        if (rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'Data lama not found',
            });
        }

        const namaFileLama = rows[0].gambar;

        // Hapus file lama jika ada
        if (namaFileLama && gambar) {
            const pathFileLama = path.join(__dirname, '../public/images', namaFileLama);
            fs.unlinkSync(pathFileLama);
        }

        const updateData = {
            nama_jurusan: req.body.nama_jurusan,
            gambar: gambar
        };

        connection.query('UPDATE jurusan SET ? WHERE id_j = ?', [updateData, id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    status: false,
                    message: 'Server Error',
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    status: false,
                    message: 'Data not found',
                });
            }

            return res.status(200).json({
                status: true,
                message: 'Update Success..!',
            });
        });
    });
});

router.delete('/delete/(:id)', function(req, res){
    let id = req.params.id;

    connection.query(`select * from jurusan where id_j = ${id}`, function(err, rows){
        if(err){
            return res.status(500).json({
                status: false,
                message: 'Server cek file lama Error',
            })
        }if(rows.length === 0){
            return res.status(404).json({
                status: true,
                message: 'Data file lama not found !',
            })
        }

        const fileLama = rows[0].gambar
        if(fileLama){
            const pathFileLama = path.join(__dirname, '../public/images', fileLama)
            fs.unlinkSync(pathFileLama);
        }

        connection.query(`delete from jurusan where id_j = ${id}`, function (err, rows) {
            if(err){
                return res.status(500).json({
                    status: false,
                    message: 'Server Error',
                })
            }else{
                return res.status(200).json({
                    status: true,
                    message: 'Data has ben delete !',
                })
            }
        })

    })

    
})

module.exports = router;