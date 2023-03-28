const PORT = process.env["PORT"] || 49732;
console.log("Started.");

const fs = require("node:fs");

const data = {
    intruder: {},
    numbers: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"]
}

data.intruder.entries = fs.readFileSync("intruder.txt", "utf-8").replace(/\r\n/g, "\n").split("\n\n").map(cat => {
    let arr = cat.split("\n");
    let name = arr.shift().substring(2);
    let weight = parseInt(name.substring(name.length - 2, name.length));
    name = name.substring(0, name.length - 2);
    return { name, weight, arr, start: 0 }
});

data.intruder.weights = data.intruder.entries.reduce((acc, x, i) => {
    data.intruder.entries[i].start = acc;
    acc += x.weight;
    return acc;
}, 0);

const config = require("./config.json");
const { Client, Events, GatewayIntentBits, GuildMember, Message } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
    ]
});

console.log("Logging in...");
client.login(config.token);

client.once(Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);

    console.log(await setupChannel("1089518756113428566"));
    
    client.on(Events.MessageCreate, async (msg) => {
        if (msg.author.id == client.user) return;
        if (msg.type == 0 && !!msg.channel.recipient) {
            if (msg.content.startsWith("channel ")) {
                await setupChannel(msg.content.substring(8));
            }
        } else if (msg.type == 0) {
            const str = msg.content;
            if (str.startsWith("!intruder")) {
                intruder({find: 5*60, vote: 50}, msg.channel, await msg.guild.members.fetch(msg.author.id), ...msg.mentions.members.values());
            }
        }
    });
});

/**
 * 
 * @param  {...GuildMember} members 
 */
async function intruder(time, channel, ...members) {
    let num = Math.floor(Math.random() * data.intruder.weights);

    let pick = data.intruder.entries[data.intruder.entries.length - 1];
    /*
    for (const entry of data.intruder.entries) {
        if (num < entry.start) {
            pick = entry;
            break;
        }
    }
    //*/

    let category = pick.name;

    num = Math.floor(Math.random() * pick.arr.length);
    let choice = pick.arr[num];

    let sussymem = members[Math.floor(Math.random() * members.length)];
    let sussy = sussymem.id;
    //let sussy = "";

    for (let member of members) {
        member = await member.fetch();
        let msg = "-----------------------------------------\n";
        if (member.id == sussy) msg += "You are the intruder!\nCategory: " + category;
        else msg += "You are not the intruder.\nCategory: " + category + "\nTopic: " + choice;
        try {
            let dms = await ((member.dmChannel == null) ? member.createDM() : member.dmChannel.fetch());
            dms.send(msg);
        } catch (err) {
            await channel.send("One or more of the users has DMs off.");
            return;
        }
    }

    await channel.send("Sent the topic to all users! The sussy intruder lingers in the dark...");
    await channel.send("Voting starts in " + time.find + " seconds!");

    await (new Promise((res) => setTimeout(res, time.find * 1000)));

    let votemsg = "Time's up! Vote on the intruder on this message.\nVoting ends in " + time.vote + " seconds.\n";
    for (let i = 0; i < members.length; i++)
        votemsg += data.numbers[i] + " - " + members[i].displayName + "\n";

    /**
     * @type {Message} 
     */
    let msg = await channel.send(votemsg);
    let reacts = [new Promise((res) => setTimeout(res, time.vote * 1000))];
    for (let i = 0; i < members.length; i++)
        reacts.push(msg.react(data.numbers[i]));
    await Promise.all(reacts);

    await channel.send("Voting ended! The intruder was: " + sussymem.displayName + "\nThe topic will be revealed in 15 seconds.");
    await (new Promise((res) => setTimeout(res, 15000)));
    await channel.send("The topic was: " + choice);
}

async function setupChannel(id) {
    const channel = await client.channels.fetch(id);
    await channel.send("Channel ready for games!");
    return (channel.name);
}

const express = require("express");
const server = express();

server.use("/html/", express.static("htdocs"));

server.get("/app/ready-channel/:id", async (req, res) => {
    res.send(await setupChannel(req.params.id));
});

server.listen(PORT, () => console.log("Server started!", PORT));