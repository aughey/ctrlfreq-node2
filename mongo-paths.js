module.exports = {
url: function() {
       if(process.env.MONGO_URL) {
         return process.env.MONGO_URL;
       } else {
         return 'mongodb://localhost:27017/ctrlfreq-node2';
       }
     }
};
