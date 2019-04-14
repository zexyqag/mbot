const Discord = require("discord.js");
const bot = new Discord.Client();

const catagoryName = "Dynamic voice";
const voiceName = "Join to create";
const AFKName = "AFK";

var fs = require('fs')
var tempServerRoles = {};

fs.readFile('tempserverroles.json', 'utf8', async function(err, data){
    if (err){
        fs.writeFile('tempserverroles.json', JSON.stringify(tempServerRoles, null, 2),function(err){
            if (err){
                console.log(err);
            }
        });
    } else {
    tempServerRoles = JSON.parse(data);
}});

bot.login("");

bot.on("ready", function(){

    initiateRoles();
    initiateVoiceChannels();
})

bot.on("message", function(message){

    if (message.content.substring(1,0) == '!' && message.author != bot.user) {
        var cmd = message.content.substring(1).split(' ')[0]; 
        var args = message.content.replace("!"+cmd+" ","");

        switch(cmd) {
            case 'help':
                    message.channel.send("```commands available:"+"\n"+"!help"+"\n"+"!create (name of role)"+"\n"+"!join (name of role)"+"\n"+"!abandon (name of role)"+"\n"+"!roles```");
            break;
            case 'create':

                var role = message.guild.roles.find(function(element){
                    return element.name == args;
                });

                if (role == undefined){

                    message.guild.createRole({
                        name: args,
                        color: 'GREEN',
                        mentionable: true,
                    })
                        .then(function(newRole){
                            message.guild.member(message.author).addRole(newRole);
                            tempServerRoles[message.guild.id].push(newRole.id);
                            fs.writeFile('tempserverroles.json', JSON.stringify(tempServerRoles, null, 2),function(err){
                                if (err){
                                    console.log(err);
                                }
                            });
                        }); 
                    message.channel.send("Role has been created and joined");                   
                }else{
                    message.channel.send("Role already exist");
                }

            break;
            case 'join':

                var role = message.guild.roles.find(function(element){
                    return element.name == args;
                });

                if (role != undefined){
                    if  (tempServerRoles[message.guild.id].find(function(element){
                        return element == role.id;
                    }) != ""){
                        
                        if  (message.guild.member(message.author).roles.find(function(element){
                            return element.id == role.id;
                        }) != null){
                            message.channel.send("You already have that role");
                        }else{
                            message.guild.member(message.author).addRole(role);
                            message.channel.send("You have joined the role!");
                        }
                    }else{
                        message.channel.send("Role cannot be joined with this command");
                    }
                }else{
                    message.channel.send("Role doesn't exist");
                }

            break;
            case 'abandon':
            
                var role = message.guild.roles.find(function(element){
                    return element.name == args;
                });

                if (role != undefined){

                    if(tempServerRoles[message.guild.id].includes(role.id)){
                        if(message.guild.member(message.author).roles.has(role.id)){
                            message.guild.member(message.author).removeRole(role);
                            message.channel.send("Role has been abandoned");
                            if (role.members.size == 1){
                                role.delete("Role has no users"); 
                                tempServerRoles[message.guild.id].splice( tempServerRoles[message.guild.id].indexOf(role.id), 1 );
                                fs.writeFile('tempserverroles.json', JSON.stringify(tempServerRoles, null, 2),function(err){
                                    if (err){
                                        console.log(err);
                                    }
                                });
                                message.channel.send("No users left in role, role has been removed");
                            }      
                        }else{
                            message.channel.send("You are not in that role");
                        }
                    }else{
                        message.channel.send("Role cannot be abandoned");
                    }
                }else{
                    message.channel.send("Role doesn't exist");
                }          

            break;
            case 'roles':

                var roles = "The following roles are available:";

                tempServerRoles[message.guild.id].forEach(function(role){
                    roles = roles+"\n"+message.guild.roles.find(function(element){
                        return element.id == role;
                    }).name;
                })

                message.channel.send(roles);

            break;
         }
     }
})

bot.on("guildCreate", function(){
    initiateRoles();
    initiateVoiceChannels();
})

bot.on("channelUpdate", function(oldChannel, newChannel){
    if (oldChannel != undefined && (oldChannel.name == catagoryName || oldChannel.name == voiceName || oldChannel.name == AFKName) && !(newChannel.name == catagoryName || newChannel.name == voiceName || newChannel.name == AFKName)){
        newChannel.delete();
        oldChannel.guild.createChannel(oldChannel.name,oldChannel.type)
        .then(function(newerChannel){
            newerChannel.setParent(oldChannel.parent);
        })
    }
})

bot.on("voiceStateUpdate", function(oldMember, newMember){ 
    if (newMember.voiceChannel != undefined){
        if(newMember.voiceChannel.parent != undefined){
            if (newMember.voiceChannel.parent.name == catagoryName && newMember.voiceChannel.name == voiceName){
                newMember.guild.createChannel((newMember.displayName+"'s channel"),"voice")
                .then(function(memberChannel){
                    memberChannel.setParent(newMember.voiceChannel.parent)
                    .then(function(){
                        newMember.setVoiceChannel(memberChannel);
                    })
                })
            }
        }
    }
    if (oldMember.voiceChannel != undefined){
        if(oldMember.voiceChannel.parent != undefined){
            if(oldMember.voiceChannel.parent.name == catagoryName && !(oldMember.voiceChannel.name == voiceName || oldMember.voiceChannel.name == AFKName) && oldMember.voiceChannel.members.size == 0){
                oldMember.voiceChannel.delete("Channel no longer used")
                .catch(console.error);
                
            }
        }
    }
})

bot.on("channelDelete", function(channel){
    if (channel.name == catagoryName){
        channel.guild.createChannel(catagoryName,"category")
        .then(function(parentChannel){
            channel.guild.channels.forEach(function(childChannel){
                if (childChannel.name == AFKName || childChannel.name == voiceName){
                    parentChannel.setParent(parentChannel);
                }
            })
        })
    }else if(channel.parent != undefined){
        if(channel.parent.name == catagoryName){
            if (channel.name == voiceName && channel.parent.name == catagoryName){
                channel.guild.createChannel(voiceName,"voice")
                .then(function(childChannel){
                    childChannel.setParent(channel.parent);
                })
            }else if (channel.name == AFKName && channel.parent.name == catagoryName){
                channel.guild.createChannel(AFKName,"voice")
                .then(function(childChannel){
                    childChannel.setParent(channel.parent);
                    channel.guild.setAFKChannel(childChannel);
                })
            }
        }

    }   
})

function initiateRoles(){
    for (jguild in tempServerRoles){
        shouldDelete = true;
        bot.guilds.forEach(function(guild){
            if (tempServerRoles[guild.id] != null){
                shouldDelete = false;
            }
        })
        if (shouldDelete){
            delete jguild;
        }
    }

    bot.guilds.forEach(function(guild){
        var addServerToList = true;

        if (tempServerRoles[guild.id] != null){
            addServerToList = false;
            tempServerRoles[guild.id].forEach(function(jrole, jindex){
                role = guild.roles.find(function(element){
                    return element.id == jrole;
                })

                if (role == null){
                    tempServerRoles[guild.id].splice( tempServerRoles[guild.id].indexOf(jrole), 1 );
                } else if (role.members.size == 0){
                    role.delete("Role has no users");
                    tempServerRoles[guild.id].splice( tempServerRoles[guild.id].indexOf(jrole), 1 );
                }
            })
        }

        if (addServerToList){
            tempServerRoles[guild.id] = [];
        }
    })
    fs.writeFile('tempserverroles.json', JSON.stringify(tempServerRoles, null, 2),function(err){
        if (err){
            console.log(err);
        }
    });
}

function initiateVoiceChannels(){
        bot.guilds.forEach(function(guild) {

            var createCategory = true;
            
            guild.channels.forEach(function(channel){
                if (channel.name == catagoryName && channel.type == "category"){
                    createCategory = false;
                    var createAFK = true;
                    var createVoice = true;
                    
                    channel.children.forEach(function(subChannel){
                        if (subChannel.type != "voice" || (subChannel.name == voiceName && createVoice == false) || (subChannel.name == AFKName && createAFK == false) || (subChannel.members.size == 0 && subChannel.name != voiceName && subChannel.name != AFKName)){
                            subChannel.delete()
                                .catch(console.error);
                            
                        } else if (subChannel.name == voiceName){
                            subChannel.setPosition(0);
                            createVoice = false;
                            subChannel.members.forEach(function(member){
                                guild.createChannel((member.displayName+"'s channel"),"voice")
                                .then(function(memberChannel){
                                    memberChannel.setParent(channel);
                                    member.setVoiceChannel(memberChannel);
                                })
                            })
                        }  else if (subChannel.name == AFKName){
                            subChannel.setPosition(1);
                            createAFK = false;
                        }
                    })
                    if (createVoice){
                        guild.createChannel(voiceName,"voice")
                        .then(function(subChannel){
                            subChannel.setParent(channel);
                        })
                    }
                    if (createAFK){
                        guild.createChannel(AFKName,"voice")
                        .then(function(subChannel){
                            subChannel.setParent(channel);
                            guild.setAFKChannel(subChannel);
                        })
                    }
                }
            })

            if (createCategory){
                guild.createChannel(catagoryName,"category")
                .then(function(parentChannel){
                    guild.createChannel(voiceName,"voice")
                    .then(function(childChannel){
                        childChannel.setParent(parentChannel);
                    })
                    guild.createChannel(AFKName,"voice")
                    .then(function(childChannel){
                        childChannel.setParent(parentChannel);
                        guild.setAFKChannel(childChannel);
                    })
                })
            }
        }) 
}
