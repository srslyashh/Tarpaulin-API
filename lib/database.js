const { Collection } = require("mongoose");

/** Primatives for interacting with the database
 *  - All functions take the collection, any parameters, and the res object
 *  - If the function fails it sets the status and returns false
 */
module.exports = {
    /** GETs the object of the specified ID */
    find: async function (model, id, res) {
        try {
            const obj = await model.findById(id).exec();
            if (obj === null) {
                res.status(404).send({
                    err: `${model.collection.collectionName} ID does not exist`,
                });
                return false;
            }
            return obj;
        } catch {
            res.status(400).send({
                err: `Could not parse ${model.collection.collectionName} ID`,
            });
            return false;
        }
    },
    /** GETs the object list from the specified ID */
    findAll: async function (model, id, res) {
        try {
            const obj = await model.find({ id: id }).exec();
            if (obj == null) {
                res.status(404).send({
                    err: `${model.collection.collectionName} ID does not exist`,
                });
                return false;
            }
            return obj;
        } catch (err) {
            console.log(err);
            res.status(400).send({
                err: `Could not parse ${model.collection.collectionName} ID`,
            });
            return false;
        }
    },
    getByPage: async function(model, page, res, selections){
     try
     {
       const obj = await model.find({}).exec()
       if(obj)
       {
         try
         {
            const count = await model.countDocuments({})
             const pageSize = 10
             const lastPage = Math.ceil(count/pageSize)

             page = page > lastPage ? lastPage : page
             page = page < 1 ? 1 : page
             const offset = (page - 1) * pageSize

             const data = await model.find()
                    .select(selections)
                  .skip(offset)
                  .limit(pageSize)
                  .sort({
                    _id: 'asc'
                  })
                  .exec()

             const returnVal = {
               data: data,
               page: page,
               totalPages: lastPage,
               pageSize: pageSize,
               count: count
             }
             return returnVal
         }
         catch(err)
         {
           console.log(err);
         }
       }
       else
       {
         res.status(404).send({
             err: `${model.collection.collectionName} ID does not exist`,
         });
         return false
       }
     }
     catch(err)
     {
       console.log(err);
       res.status(400).send({
           err: `Could not parse ${model.collection.collectionName} ID`,
       });
       return false;
     }
    },
    getBySubmissionId: async function(model, courseId, page, res)
    {
      try
      {
        //console.log("=== CourseId: ", courseId)
        //const cId = courseId.valueOf()
        //console.log("id: ", cId)
        console.log("HEre", courseId)
        const obj = await model.find({courseId: courseId}).exec()
        if(obj)
        {
          try
          {
            console.log("Data", obj)

            const count = obj.length
             const pageSize = 10
             const lastPage = Math.ceil(count/pageSize)

             page = page > lastPage ? lastPage : page
             page = page < 1 ? 1 : page
             const offset = (page - 1) * pageSize

              const data = await model.find({courseId: courseId})
                   .skip(offset)
                   .limit(pageSize)
                   .sort({
                     _id: 'asc'
                   })
                   .exec()

              const returnVal = {
                data: data,
                page: page,
                totalPages: lastPage,
                pageSize: pageSize,
                count: count
              }
              return returnVal
          }
          catch(err)
          {
            console.log(err);
          }
        }
        else
        {
          res.status(404).send({
              err: `${model.collection.collectionName} ID does not exist`,
          });
          return false
        }
      }
      catch(err)
      {
        console.log(err);
        res.status(400).send({
            err: `Could not parse ${model.collection.collectionName} ID`,
        });
        return false;
      }
    },
    /** POSTs the object in the collection */
    save: async function (model, obj, res) {
        try {
            await obj.save();
        } catch {
            res.status(400).send({
                err: `Invalid ${model.collection.collectionName} body`,
            });
            return false;
        }
        return obj;
    },
    /** PUTs/overwrites the object in the collection */
    update: async function (model, obj, id, res) {
        // GET the original object to replace
        const oldObj = await this.find(model, id, res);
        if (oldObj === false) return false;
        try {
            // We have to validate the new object manually
            await obj.validate();
            // Overwrite it and save the changes
            oldObj.overwrite(obj);
            await oldObj.save();
            return oldObj;
        } catch {
            res.status(400).send({
                err: `Invalid ${model.collection.collectionName} body`,
            });
            return false;
        }
    },
    /** PATCH/edits a body of some data */
    updateOne: async function (id, resource, req, res) {
        const data = req.body;
        console.log("req.params: ", req.params)
        const resourceId = req.params.id;

        Collection.findById(id, function (err, collection) {
            try {
                const subdoc = collection[resource].id(resourceId);

                _each(data, function(d, k) {
                    subdoc[k] = d;
                });

                collection.save(function (err, docs) {
                    res.status(200).send({
                        changes: subdoc
                    });
                })
            } catch {
                res.status(400).send({      //MIGHT be a different response
                    err: `Invalid ${resource.collection.collectionName} body`
                });
                return false;
            }
        })
    },
};
