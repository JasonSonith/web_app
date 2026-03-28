from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import bcrypt
import jwt
import datetime
import os
import re

app = Flask(__name__, static_folder ='static')
SECRET_KEY = os.environ.get('JWT_SECRET', os.urandom(32).hex())
DATABASE = 'securenotes.db'

'''
Database Helpers
'''


