# CS 493 Final Project - Tarpaulin RESTful API

## Developers
- Jonathan Dressel - dresselj@oregonstate.edu
- Kathleen Ashley - ashleyk@oregonstate.edu
- Ethan Barker - barkeret@oregonstate.edu
- Tanmay Badageri - badagert@oregonstate.edu

## Table of Contents

- [Project Description](#project-description)
- [Entities in the Assignment](#entities-in-the-assignment)
- [Endpoints](#endpoints)

## Project Description

- **Overview**: This repository contains the implementation of the CS 493 Final Project - Tarpaulin RESTful API. 

## Entities in the Assignment

- **Users**: Represent application users, categorized into admin, instructor, and student roles, each with distinct permissions as defined in the Tarpaulin OpenAPI specification.

- **Courses**: Represent courses in Tarpaulin, containing basic information such as subject code, number, title, instructor, and more. Courses also have associated data, including enrolled students and assignments.

- **Assignments**: Represent individual assignments within a course. Each assignment belongs to a specific course and includes basic details like title, due date, and a list of student submissions.

- **Submissions**: Represent student submissions for assignments. Submissions are associated with both the assignment they belong to and the student who made the submission. They include a submission timestamp, an uploaded file, and the potential for a grade assignment.

## Endpoints

- **Course Roster Download**: Accessible via the `GET /courses/{id}/roster` endpoint, authorized users can download a CSV-formatted roster for a specific course. The roster should contain a list of currently enrolled students.

- **Assignment Submission Creation**: Enabled by the `POST /assignments/{id}/submissions` endpoint, authorized student users can upload file submissions for specific assignments. Files uploaded for submissions must be stored in a way that allows them to be later downloaded via URL.

- **User Data Fetching**: Accessed through the `GET /users/{id}` endpoint, users can view their own data. Only logged-in users can access this data, which should include the list of classes they are enrolled in (for students) or teaching (for instructors).

- **Course Information Fetching**: Provided by the `GET /courses` and `GET /courses/{id}` endpoints, users can access information about all courses or a specific course. Note that these endpoints do not return information about a course's enrolled students or assignments. Separate endpoints are available for those details.


