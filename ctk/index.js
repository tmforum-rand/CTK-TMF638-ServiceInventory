const readline = require('readline');
const rp = require('request-promise');
var DefaultURL = "${APIDEFAULTURL}/tmf-api/serviceInventory/v4/";
var schema;
var hostname;
var port;
var APIRelativeAddress;
var statusCode;
const exampleEndPoint = "/service";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("////////////////////////////////////////////////////////////////////////\nWelcome to the Conformance Test Kit for TMF638 ServiceInventory R18 5\n");
getURL();




function isURLValid(triedURL){

    var options = {
        uri: triedURL + exampleEndPoint,
        
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true, // Automatically parses the JSON string in the response
        resolveWithFullResponse: true
    };
    rp(options).then(function(jsonString) {
        statusCode = jsonString.statusCode;
        if (statusCode == 200){
            console.log("API Found on: " + triedURL + exampleEndPoint);
            exportEnvironment(triedURL);
            runNewman();
        }
        else {
            console.log("\n_______________________________________\nERROR:");
            console.log("No API found on:")
            console.log("_______________________________________\n");
            return false;
        }
    }).catch(function (err) {
        console.log("\n_______________________________________\nERROR:");
        console.log(err + " while processing "+ triedURL + "\n" + err.stack);
        console.log("_______________________________________\n");
    });
    
  

    
}



function breakDownURL(URL){
    
    if (URL.includes("https://")){
        schema = "https";
    }
    if (URL.includes("http://")){
        schema = "http";
    }
    if (URL.lastIndexOf(":") == URL.indexOf(":")){
        if (schema == "http"){
            port = 80;
        }
        if (schema == "https"){
            port = 443;
        }
        hostname = URL.substr(URL.indexOf("//")+2, URL.length);
        console.log(`HOSTNAME: ${hostname}`);
        hostname = hostname.substr(0,hostname.indexOf("/"));
        console.log(`HOSTNAME: ${hostname}`);
        APIRelativeAddress = URL.substr(URL.indexOf(hostname)+hostname.length,URL.length);
        console.log(`APIRELATIVEADDRESS: ${APIRelativeAddress}`);
    }
    else {
        hostNameStart = URL.indexOf("//")+2;
        hostNameEnd = URL.lastIndexOf(":");
        
        hostNameLenght = hostNameEnd - hostNameStart;
        hostname = URL.substr(hostNameStart,hostNameLenght);
        
        portStart = URL.lastIndexOf(":")+1;
        portAndEndPoint = URL.substr(portStart);
        port = portAndEndPoint.substr(0,portAndEndPoint.indexOf("/"));
        APIRelativeAddress = portAndEndPoint.substr(portAndEndPoint.indexOf("/"));
    }    
    
    //console.log(schema+"://"+hostname+":"+port+APIRelativeAddress);
    
    
    
}

function getURL(){
    
    rl.question('////////////////////////////////////////////////////////////////////////\n'+
    'What is your full API address omiting the endpoint? example:\n'+
    'https://apictk-service-inventory-management-v4-0-0.mybluemix.net/tmf-api/serviceInventory/v4/service\n'+
    'becomes\n'+
    'https://apictk-service-inventory-management-v4-0-0.mybluemix.net/tmf-api/serviceInventory/v4\n>', (answer) => {
    DefaultURL = answer;
    rl.close();
    isURLValid(answer);
    
    });

}

function exportEnvironment(url){

    var fs = require('fs');
    var environmentFile = "CTK-TMFENV-V4.0.0.postman_environment.json";    
    var content = fs.readFileSync(environmentFile, "utf8");
    var envJson = JSON.parse(content);
    envJson.name = "TMForumR18.5";
    envJson.values.forEach(element => {
        if (element.key == "ServiceInventoryAPI"){
            element.value = url;
        }
    });
    jsonData = JSON.stringify(envJson);
    fs.writeFileSync("TMFENV.json", jsonData);


}

function runNewman(){
    var newman = require('newman');

    newman.run({
        collection: require('./CTK-TMF638-ServiceInventory-R18-5.postman_collection.json'),
        environment: require('./TMFENV.json'),
        insecure: true,
        reporters: ['html','json'],
        reporter: {
            html: {
                export: '../htmlResults.html', // If not specified, the file will be written to `newman/` in the current working directory.
                //template: './customTemplate.hbs' // optional, this will be picked up relative to the directory that Newman runs in.
            },
            json: {
                export: '../jsonResults.json'
            }
        }
    }).on('start', function (err, args) {
        console.log('running a collection...');
    }).on('done', function (err, summary) {
        if (err || summary.error) {
            if (err){
                console.error('collection run encountered an error. ' + err);
            }
            if (summary.error){
                console.log("Collected run completed but with errors, please check htmlResults.html for details. Your API didn't pass the Conformance Test Kit.");
            }
            
        }
            
        else {
            console.log('Collection run completed without errors, you passed the Conformance Test Kit, jsonResults.json and htmlResults.html have the details and can be forwarded to TMForum.');        }
    });
}