module.exports = {
url: function() {
       if(process.env.MONGO_URL) {
         return process.env.MONGO_URL;
       } else {
         var url = 'mongodb://localhost:27017/ctrlfreq-node2';
       }
     }
};
