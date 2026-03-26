from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import bcrypt
import jwt
import datetime
import os
import re

