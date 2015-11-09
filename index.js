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
    
    this.bot_username       = undefined;
    this.bot_token          = undefined;
    this.chat_id            = undefined;

}

inherits(TelegramBot, AutomationModule);

_module = TelegramBot;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

TelegramBot.prototype.init = function (config) {
    TelegramBot.super_.prototype.init.call(this, config);

    var self = this;
    
    self.bot_username       = config.bot_username.toString();
    self.bot_token          = config.bot_token.toString();
    self.langFile           = self.controller.loadModuleLang("TelegramBot");
    
    this.devices = {};

    this.handleDeviceUpdates = function (vDev) {
        self.updateDeviceState(vDev);
    };
    
    // Setup event listener
    self.controller.devices.on('change:metrics:level', self.handleDeviceUpdates);
};

TelegramBot.prototype.stop = function () {
    
    var self = this;
    
    // Remove event listeners
    self.controller.devices.off('change:metrics:level', self.handleDevUpdates);
       
    TelegramBot.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

TelegramBot.prototype.updateDeviceState = function(vDev) {
    
    var self = this;
    
    //debugPrint('TelegramBot: Device update ' + JSON.stringify(vDev));
    //debugPrint('TelegramBot: config ' + JSON.stringify(self.config));
   
    _.each(self.config.switches,function(element) {
        if(element.device == vDev.id) {
            if (element.level=='toggle') {
                self.sendMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
            }
            else if (vDev.get('metrics:level') == element.level) {
                 self.sendMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
            }
        }
    });
    
    _.each(self.config.multilevelswitches,function(element) {
        if (element.device == vDev.id) {
            switch (element.comparison) {
                case 'equalto':
                    if (vDev.get('metrics:level') == element.level) {
                         self.sendMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
                case 'largerthan':
                    if (vDev.get('metrics:level') > element.level) {
                         self.sendMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
                case 'smallerthan':
                    if (vDev.get('metrics:level') < element.level) {
                         self.sendMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
            }
        }
    });
    _.each(self.config.multilevelsensors,function(element) {
        if (element.device == vDev.id) {
            switch (element.comparison) {
                case 'equalto':
                    if (vDev.get('metrics:level') == element.level) {
                         self.sendMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
                case 'largerthan':
                    if (vDev.get('metrics:level') > element.level) {
                         self.sendMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
                case 'smallerthan':
                    if (vDev.get('metrics:level') < element.level) {
                         self.sendMessage(vDev.get('deviceType'),vDev.get('metrics:title'),vDev.get('metrics:level'));
                    }
                    break;
            }
        }
    });
};

TelegramBot.prototype.sendMessage = function(dType, dName , dStatus) {

    var self = this;
    var message = dName + ' ' + dStatus;
    if (self.chat_id==undefined) {
        var url = 'https://api.telegram.org/bot' + this.bot_token + '/getUpdates?offset=0 ';
        http.request({
            url: url,
            async: true,
            success: function(response) {
                self.chat_id = response.data.result[0].message.chat.id;
                self.sendMessage(dType, dName , dStatus);
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
    else {
        var url = 'https://api.telegram.org/bot' + this.bot_token + '/sendMessage?chat_id='+this.chat_id+'&text='+message;
        http.request({
            url: url,
            async: true,
            success: function(response) {
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