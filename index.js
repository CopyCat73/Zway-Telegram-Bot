/*** Telegram Bot Z-Way module *******************************************

Version: 1.00
(c) CopyCatz, 2015
-----------------------------------------------------------------------------
Author: CopyCatz <copycat73@outlook.com>
Description: Telegram Bot

******************************************************************************/

function TelegramBot (id, controller) {
    // Call superconstructor first (AutomationModule)
    TelegramBot.super_.call(this, id, controller);
    
    this.bot_token              = undefined;
    this.username               = undefined;
    this.commandSelected        = undefined;
    this.roomSelected           = undefined;
    this.deviceSelected         = undefined;
    this.deviceIndex            = undefined;
    this.usingWebhook           = false;
}

inherits(TelegramBot, AutomationModule);

_module = TelegramBot;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

TelegramBot.prototype.init = function (config) {
    TelegramBot.super_.prototype.init.call(this, config);

    var self = this;
    
    self.bot_token              = config.bot_token.toString();
    self.username               = config.username.toString();
    self.langFile               = self.controller.loadModuleLang("TelegramBot");
    self.commandSelected        = '';
    self.roomSelected           = '';
    self.deviceSelected         = '';
    self.deviceIndex            = [];
    
    
    //this.devices = {};

  
    this.handleDeviceUpdates = function (vDev) {
        self.updateDeviceState(vDev);
    };
    
    // Setup event listener
    self.controller.devices.on('change:metrics:level', self.handleDeviceUpdates);
    
    Telegram = function(url, request) {
        
        if (request.body!=undefined) {
            var response = JSON.parse(request.body);
            self.config.chat_id = response["message"]["chat"]["id"];
            self.saveConfig();
            var messageText = response["message"]["text"];
            if (messageText.charAt(0)=='/') {
                self.processCommand(messageText.slice(1));
            }
            else if (self.roomSelected!=''||self.commandSelected!='') {
                self.processResponse(messageText);
            }
            else {
                self.resetDialogue(true);
            }
        }
        return 'OK';
    };        
    
    if (config.webhook_url.toString()!='') {
        //ws.allowExternalAccess("Telegram", this.controller.auth.ROLE.USER);
        ws.allowExternalAccess("Telegram", this.controller.auth.ROLE.ANONYMOUS);
        self.setWebhook(config.webhook_url.toString());
    }
        
};
    


TelegramBot.prototype.stop = function () {
    
    var self = this;
    
    // Remove event listeners
    self.controller.devices.off('change:metrics:level', self.handleDeviceUpdates);

    ws.revokeExternalAccess("Telegram");
    Telegram = null;
    if (self.usingWebhook) {
        self.setWebhook('');
    }
       
    TelegramBot.super_.prototype.stop.call(this);
 
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

TelegramBot.prototype.updateDeviceState = function(vDev) {
    
    var self = this;
    
    _.each(self.config.switches,function(element) {
        if(element.device == vDev.id) {
            if (element.level=='toggle') {
                self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
            }
            else if (vDev.get('metrics:level') == element.level) {
                 self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
            }
        }
    });
    
    _.each(self.config.multilevelswitches,function(element) {
        if (element.device == vDev.id) {
            switch (element.comparison) {
                case 'equalto':
                    if (vDev.get('metrics:level') == element.level) {
                         self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
                case 'largerthan':
                    if (vDev.get('metrics:level') > element.level) {
                         self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
                case 'smallerthan':
                    if (vDev.get('metrics:level') < element.level) {
                         self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
            }
        }
    });
    
    _.each(self.config.binarysensors,function(element) {
        if(element.device == vDev.id) {
            if (element.level=='toggle') {
                self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
            }
            else if (vDev.get('metrics:level') == element.level) {
                 self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
            }
        }
    });
    
    _.each(self.config.multilevelsensors,function(element) {
        if (element.device == vDev.id) {
            switch (element.comparison) {
                case 'equalto':
                    if (vDev.get('metrics:level') == element.level) {
                         self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
                case 'largerthan':
                    if (vDev.get('metrics:level') > element.level) {
                         self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
                case 'smallerthan':
                    if (vDev.get('metrics:level') < element.level) {
                         self.composeMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
            }
        }
    });
};

TelegramBot.prototype.composeMessage = function(dType, dName , dStatus) {
    
    var self = this;
    var message = dName + ' ' + dStatus;
    self.sendMessage(message);
}

TelegramBot.prototype.sendMessage = function(message, keyboard) {

    var self = this;
    if (typeof keyboard === 'undefined') { keyboard = ''; }
    if (self.config.chat_id==undefined&&self.usingWebhook==false) {
        var url = 'https://api.telegram.org/bot' + this.bot_token + '/getUpdates?offset=0 ';
        http.request({
            url: url,
            async: true,
            success: function(response) {
                //self.chat_id = response.data.result[0].message.chat.id;
                self.config.chat_id = response.data.result[0].message.chat.id;
                self.saveConfig();
                self.sendMessage(message);
            },
            error: function(response) {
                console.error("[TelegramBot] channel fetch error");
                console.logJS(response);
                self.controller.addNotification(
                    "error", 
                    self.langFile.err_fetch_channel, 
                    "module", 
                    "TelegramBot"
                );
            }
        });
    }
    else if (self.config.chat_id==undefined&&self.usingWebhook) {
        // should not be happening since webhook pushes the id
    }    
    else {
        var url = "https://api.telegram.org/bot" + this.bot_token + "/sendMessage?chat_id="+self.config.chat_id+"&text="+ encodeURIComponent(message)+"&reply_markup="+ encodeURIComponent(keyboard);
        http.request({
            url: url,
            async: true,
            success: function(response) {
                console.log("[TelegramBot] message sent "+message);
            },
            error: function(response) {
                console.error("[TelegramBot] send message error");
                console.logJS(response);
                self.controller.addNotification(
                    "error", 
                    self.langFile.err_send_message, 
                    "module", 
                    "TelegramBot"
                );
            }
        });
    }
};

TelegramBot.prototype.setWebhook = function(url) {
    
    var self = this;
    var base_url = 'https://api.telegram.org/bot' + this.bot_token + '/setWebhook';
    http.request({
        url: base_url,
        async: true,
        method: "POST",
        headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
            url: url
        },
        success: function(response) {
            console.log("[TelegramBot] webhook set");
            self.usingWebhook = true;
        },
        error: function(response) {
            console.error("[TelegramBot] webhook set error");
            console.logJS(response);
            self.controller.addNotification(
                "error", 
                self.langFile.err_send_message, 
                "module", 
                "TelegramBot"
            );
        }
    }); 
};

TelegramBot.prototype.processCommand = function(command) {
    
    var self = this;
    var response = self.langFile.err_unknown_command;
    var keyboard;
    self.resetDialogue(false);
 
    switch (command) {
        case 'help':
            response = self.langFile.help_text;
            keyboard = JSON.stringify({ 
                keyboard: [['/home','/device'],['/scene','/sensor']],
                one_time_keyboard: true,
                resize_keyboard: true,
                force_reply: true
            });
            self.sendMessage(response,keyboard);
            break;
        case 'home':
            response = self.langFile.select_presence;
            keyboard = JSON.stringify({ 
                keyboard: [['Home','Away'],['Night','Vacation']],
                one_time_keyboard: true,
                resize_keyboard: true,
                force_reply: true
            });
            self.commandSelected = 'home';
            self.sendMessage(response,keyboard);
            break;
        default:
            self.selectRoom(command);
            break;
    }

};

TelegramBot.prototype.processResponse = function(response) {
    
    var self = this;
    var keyboard;
    //debugPrint('TelegramBot: processresponse');
    //debugPrint('commandSelected '+this.commandSelected);
    //debugPrint('roomSelected '+this.roomSelected);
    //debugPrint('deviceSelected '+this.deviceSelected);

    if (self.commandSelected!=''&&self.roomSelected==='') {
        if (self.commandSelected == 'home') {
            //home code tbd
        }
        else {
            //incoming room for actual device
            var rc = this.controller.locations.length;
            for (rid = 0; rid < rc; rid++) {
                if (this.controller.locations[rid].title==response) {
                    self.roomSelected = rid;
                }
            }
            if (self.roomSelected!=='') {
                switch(self.commandSelected) {
                    case 'device':
                        var keyboardOptions = [];
                        self.controller.devices.forEach(function(device) {
                            if (device.get('location')===self.roomSelected&&_.contains(['switchBinary', 'switchMultilevel'], device.get('deviceType'))) {
                                var oneRow = [];
                                var devTitle = device.get('metrics:title');
                                oneRow.push(devTitle);
                                self.deviceIndex[devTitle] = device.get('id');
                                keyboardOptions.push(oneRow);
                            }
                        });
                        var keyboard = JSON.stringify({ 
                            keyboard: keyboardOptions,
                            one_time_keyboard: true,
                            resize_keyboard: true,
                            force_reply: true
                        });
                        self.sendMessage(self.langFile.select_device,keyboard);
                        
                        break;
                    case 'scene':
                        var keyboardOptions = [];
                        self.controller.devices.forEach(function(device) {
                            if (device.get('location')===self.roomSelected&&_.contains(['toggleButton'], device.get('deviceType'))) {
                                var oneRow = [];
                                var devTitle = device.get('metrics:title');
                                oneRow.push(devTitle);
                                self.deviceIndex[devTitle] = device.get('id');
                                keyboardOptions.push(oneRow);
                            }
                        });
                        var keyboard = JSON.stringify({ 
                            keyboard: keyboardOptions,
                            one_time_keyboard: true,
                            resize_keyboard: true,
                            force_reply: true
                        });
                        self.sendMessage(self.langFile.select_device,keyboard);                    
                        
                        break;
                    case 'sensor':
                        var sensorString = '';
                        self.controller.devices.forEach(function(device) {
                            if (device.get('location')===self.roomSelected&&_.contains(['sensorBinary', 'sensorMultilevel'], device.get('deviceType'))) {
                                sensorString = sensorString+device.get('metrics:title') + ' : ' + device.get('metrics:level') + '\n';
                            }
                        });
                        self.sendMessage(sensorString);
                        break;
                   }
            }
        }
    }
    else if (self.commandSelected!=''&&self.roomSelected!==''&&self.deviceSelected==='') {
        switch(self.commandSelected) {
            case 'device':
                var rDev = self.controller.devices.get(self.deviceIndex[response]);
            
                if (rDev) {
                    self.deviceSelected = rDev;
                    if (rDev.get('deviceType') == 'switchBinary') {
                        var keyboardOptions = [];
                        keyboardOptions.push(["on"],["off"]);
                        var keyboard = JSON.stringify({ 
                            keyboard: keyboardOptions,
                            one_time_keyboard: true,
                            resize_keyboard: true,
                            force_reply: true
                        });
                        self.sendMessage(self.langFile.set_device,keyboard);
                    } else if (rDev.get('deviceType') == 'switchMultilevel') {
                        var keyboardOptions = [
                            [ "0", "25" ],
                            [ "50", "75" ]
                        ];
                        var keyboard = JSON.stringify({ 
                            keyboard: keyboardOptions,
                            one_time_keyboard: true,
                            resize_keyboard: true,
                            force_reply: true
                        });
                        self.sendMessage(self.langFile.set_device,keyboard);
                    }
                }
                else {
                    //No device seems selected
                    self.resetDialogue(true);
                }
                break;
                case 'scene':
                    var rDev = self.controller.devices.get(self.deviceIndex[response]);
                    if (rDev) {
                        rDev.performCommand("on");
                         self.resetDialogue(false);
                    }
                     self.resetDialogue(true);
                    break;
        }
    }
    else if (self.commandSelected!=''&&self.roomSelected!==''&&self.deviceSelected!=='') {
    
        if (self.deviceSelected.get('deviceType') == 'switchBinary') {
            self.deviceSelected.performCommand(response);
            self.sendMessage(self.deviceSelected.get('metrics:title') + ' turned '+response);
            self.resetDialogue(false);
        }
        else {
            self.deviceSelected.performCommand("exact", { level: response });
            self.sendMessage(self.deviceSelected.get('metrics:title') + ' set to level '+response);
            self.resetDialogue(false);
        }
   
   }  
    else {

         self.resetDialogue(true);

    }
};


TelegramBot.prototype.selectRoom = function(command) {
        
    var keyboardOptions = [];        
    var rc = this.controller.locations.length;
    for (rid = 0; rid < rc; rid++) {
        var oneRow = [];
        oneRow.push(this.controller.locations[rid].title);
        keyboardOptions.push(oneRow);
    }
    var keyboard = JSON.stringify({ 
                keyboard: keyboardOptions,
                one_time_keyboard: true,
                resize_keyboard: true,
                force_reply: true
            });
    this.commandSelected = command;
    this.sendMessage(this.langFile.select_room,keyboard);
};

TelegramBot.prototype.resetDialogue = function(withError) {
    
    this.commandSelected    ='';
    this.roomSelected       ='';
    this.deviceSelected     ='';
    this.deviceIndex        = [];
    if (withError) {
        this.sendMessage(this.langFile.unknown_command);
    }
};
            
