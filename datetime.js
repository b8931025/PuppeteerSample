  module.exports = {
    yyyymmddhhmmss:function (split1,split2) {
        let now = new Date();
        let dt = now.getFullYear().toString();
        let dateSp = (split1 != undefined) ? split1 : ""
        let timeSp = (split2 != undefined) ? split2 : ""

        dt += dateSp;
        if (now.getMonth() < 9) dt += "0";
        dt += (now.getMonth() + 1).toString();
        dt += dateSp;
        if (now.getDate() < 10) dt += "0";
        dt += (now.getDate()).toString();

        if (dateSp != "") dt+= " "

        if (now.getHours() < 10) dt += "0";
        dt += (now.getHours()).toString();
        dt += timeSp;

        if (now.getMinutes() < 10) dt += "0";
        dt += (now.getMinutes()).toString();
        dt += timeSp;

        if (now.getSeconds() < 10) dt += "0";
        dt += (now.getSeconds()).toString();
        return dt;
    },
    yyyymmdd:function (split) {
        let now = new Date();
        let dt = now.getFullYear().toString();
        if (now.getMonth() < 9) dt += "0";
        if (split) dt += split;
        dt += (now.getMonth() + 1).toString();
        if (now.getDate() < 10) dt += "0";
        if (split) dt += split;
        dt += (now.getDate()).toString();
        return dt;
    },    
  };