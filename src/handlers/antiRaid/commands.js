import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { db } from "../../utils/database.js";
import * as RaidProtection from "../../utils/raidProtection.js";
import { logger } from "../../utils/logger.js";

export const antiRaidCommands = [
  {
    name: "antiraid",
    description: "Configure anti-raid protection",
    defaultMemberPermissions: PermissionFlagsBits.ManageGuild.toString(),
    options: [
      {
        name: "toggle",
        description: "Enable or disable anti-raid protection",
        type: 1,
        options: [
          {
            name: "enabled",
            description: "Whether to enable or disable anti-raid protection",
            type: 5,
            required: true,
          },
        ],
      },
      {
        name: "action",
        description: "Set the action to take when a raid is detected",
        type: 1,
        options: [
          {
            name: "type",
            description: "The type of action to take",
            type: 3,
            required: true,
            choices: [
              { name: "Lockdown", value: "lockdown" },
              { name: "Ban", value: "ban" },
              { name: "Kick", value: "kick" },
            ],
          },
        ],
      },
      {
        name: "threshold",
        description: "Set join rate threshold for raid detection",
        type: 1,
        options: [
          {
            name: "joins",
            description: "Number of joins",
            type: 4,
            required: true,
            minValue: 3,
            maxValue: 50,
          },
          {
            name: "seconds",
            description: "Time window in seconds",
            type: 4,
            required: true,
            minValue: 1,
            maxValue: 300,
          },
        ],
      },
      {
        name: "account-age",
        description: "Set minimum account age requirement",
        type: 1,
        options: [
          {
            name: "days",
            description: "Minimum account age in days",
            type: 4,
            required: true,
            minValue: 0,
            maxValue: 365,
          },
        ],
      },
      {
        name: "exempt-role",
        description: "Add or remove role exemption from raid protection",
        type: 1,
        options: [
          {
            name: "action",
            description: "Add or remove exemption",
            type: 3,
            required: true,
            choices: [
              { name: "Add", value: "add" },
              { name: "Remove", value: "remove" },
            ],
          },
          {
            name: "role",
            description: "The role to exempt",
            type: 8,
            required: true,
          },
        ],
      },
      {
        name: "exempt-channel",
        description: "Add or remove channel exemption from lockdown",
        type: 1,
        options: [
          {
            name: "action",
            description: "Add or remove exemption",
            type: 3,
            required: true,
            choices: [
              { name: "Add", value: "add" },
              { name: "Remove", value: "remove" },
            ],
          },
          {
            name: "channel",
            description: "The channel to exempt",
            type: 7,
            required: true,
          },
        ],
      },
      {
        name: "alert-channel",
        description: "Set the channel for raid alerts",
        type: 1,
        options: [
          {
            name: "channel",
            description: "The channel for alerts",
            type: 7,
            required: true,
          },
        ],
      },
      {
        name: "notify-role",
        description: "Set the role to notify during raids",
        type: 1,
        options: [
          {
            name: "role",
            description: "The role to notify",
            type: 8,
            required: true,
          },
        ],
      },
      {
        name: "view",
        description: "View current anti-raid settings",
        type: 1,
      },
      {
        name: "lockdown",
        description: "Manually trigger or end server lockdown",
        type: 1,
        options: [
          {
            name: "action",
            description: "Enable or disable lockdown",
            type: 3,
            required: true,
            choices: [
              { name: "Enable", value: "enable" },
              { name: "Disable", value: "disable" },
            ],
          },
          {
            name: "reason",
            description: "Reason for lockdown",
            type: 3,
            required: false,
          },
        ],
      },
      {
        name: "incidents",
        description: "View recent raid incidents",
        type: 1,
        options: [
          {
            name: "limit",
            description: "Number of incidents to show",
            type: 4,
            required: false,
            minValue: 1,
            maxValue: 25,
          },
        ],
      },
    ],
  },
];

export async function handleAntiRaidCommand(interaction) {
  try {
    const subcommand = interaction.options.getSubcommand();
    const settings = await db.getRaidProtectionSettings(interaction.guild.id);
    logger.info(
      `Handling antiraid ${subcommand} command in ${interaction.guild.name}`,
    );

    switch (subcommand) {
      case "toggle": {
        try {
          const enabled = interaction.options.getBoolean("enabled");
          settings.enabled = enabled;
          await db.updateRaidProtectionSettings(interaction.guild.id, settings);
          await interaction.reply({
            content: `Anti-raid protection has been ${enabled ? "enabled" : "disabled"}.`,
            flags: 64,
          });
          logger.info(
            `Anti-raid protection ${enabled ? "enabled" : "disabled"} in ${interaction.guild.name}`,
          );
        } catch (error) {
          logger.error("Error toggling anti-raid protection:", error);
          throw error;
        }
        break;
      }
      case "action": {
        try {
          const actionType = interaction.options.getString("type");
          settings.actionType = actionType;
          await db.updateRaidProtectionSettings(interaction.guild.id, settings);
          await interaction.reply({
            content: `Anti-raid action has been set to: ${actionType}`,
            flags: 64,
          });
          logger.info(
            `Anti-raid action set to ${actionType} in ${interaction.guild.name}`,
          );
        } catch (error) {
          logger.error("Error setting anti-raid action:", error);
          throw error;
        }
        break;
      }
      case "threshold": {
        try {
          const joins = interaction.options.getInteger("joins");
          const seconds = interaction.options.getInteger("seconds");
          settings.joinThreshold = joins;
          settings.joinTimeWindow = seconds * 1000;
          await db.updateRaidProtectionSettings(interaction.guild.id, settings);
          await interaction.reply({
            content: `Raid detection threshold set to ${joins} joins within ${seconds} seconds.`,
            flags: 64,
          });
          logger.info(
            `Raid threshold updated in ${interaction.guild.name}: ${joins} joins in ${seconds}s`,
          );
        } catch (error) {
          logger.error("Error setting raid threshold:", error);
          throw error;
        }
        break;
      }
      case "account-age": {
        try {
          const days = interaction.options.getInteger("days");
          settings.accountAgeDays = days;
          await db.updateRaidProtectionSettings(interaction.guild.id, settings);
          await interaction.reply({
            content: `Minimum account age requirement set to ${days} days.`,
            flags: 64,
          });
          logger.info(
            `Account age requirement set to ${days} days in ${interaction.guild.name}`,
          );
        } catch (error) {
          logger.error("Error setting account age requirement:", error);
          throw error;
        }
        break;
      }
      case "exempt-role": {
        try {
          const roleAction = interaction.options.getString("action");
          const role = interaction.options.getRole("role");

          if (roleAction === "add") {
            if (!settings.exemptRoles.includes(role.id)) {
              settings.exemptRoles.push(role.id);
            }
          } else {
            settings.exemptRoles = settings.exemptRoles.filter(
              (id) => id !== role.id,
            );
          }

          await db.updateRaidProtectionSettings(interaction.guild.id, settings);
          await interaction.reply({
            content: `Role ${role.name} has been ${roleAction === "add" ? "added to" : "removed from"} raid protection exemptions.`,
            flags: 64,
          });
          logger.info(
            `Role ${role.name} ${roleAction === "add" ? "added to" : "removed from"} exemptions in ${interaction.guild.name}`,
          );
        } catch (error) {
          logger.error("Error updating exempt roles:", error);
          throw error;
        }
        break;
      }
      case "exempt-channel": {
        try {
          const channelAction = interaction.options.getString("action");
          const channel = interaction.options.getChannel("channel");

          if (channelAction === "add") {
            if (!settings.exemptChannels.includes(channel.id)) {
              settings.exemptChannels.push(channel.id);
            }
          } else {
            settings.exemptChannels = settings.exemptChannels.filter(
              (id) => id !== channel.id,
            );
          }

          await db.updateRaidProtectionSettings(interaction.guild.id, settings);
          await interaction.reply({
            content: `Channel ${channel.name} has been ${channelAction === "add" ? "added to" : "removed from"} lockdown exemptions.`,
            flags: 64,
          });
          logger.info(
            `Channel ${channel.name} ${channelAction === "add" ? "added to" : "removed from"} lockdown exemptions in ${interaction.guild.name}`,
          );
        } catch (error) {
          logger.error("Error updating exempt channels:", error);
          throw error;
        }
        break;
      }
      case "alert-channel": {
        try {
          const alertChannel = interaction.options.getChannel("channel");
          settings.alertChannel = alertChannel.id;
          await db.updateRaidProtectionSettings(interaction.guild.id, settings);
          await interaction.reply({
            content: `Raid alerts will now be sent to ${alertChannel}.`,
            flags: 64,
          });
          logger.info(
            `Alert channel set to ${alertChannel.name} in ${interaction.guild.name}`,
          );
        } catch (error) {
          logger.error("Error setting alert channel:", error);
          throw error;
        }
        break;
      }
      case "notify-role": {
        try {
          const notifyRole = interaction.options.getRole("role");
          settings.notifyRole = notifyRole.id;
          await db.updateRaidProtectionSettings(interaction.guild.id, settings);
          await interaction.reply({
            content: `${notifyRole} will now be notified during raids.`,
            flags: 64,
          });
          logger.info(
            `Notify role set to ${notifyRole.name} in ${interaction.guild.name}`,
          );
        } catch (error) {
          logger.error("Error setting notify role:", error);
          throw error;
        }
        break;
      }
      case "view": {
        try {
          const embed = new EmbedBuilder()
            .setTitle("Anti-Raid Protection Settings")
            .setColor("#00FF00")
            .addFields([
              {
                name: "Status",
                value: settings.enabled ? "Enabled" : "Disabled",
                inline: true,
              },
              { name: "Action", value: settings.actionType, inline: true },
              {
                name: "Join Threshold",
                value: `${settings.joinThreshold} joins / ${settings.joinTimeWindow / 1000}s`,
                inline: true,
              },
              {
                name: "Min Account Age",
                value: `${settings.accountAgeDays} days`,
                inline: true,
              },
              {
                name: "Alert Channel",
                value: settings.alertChannel
                  ? `<#${settings.alertChannel}>`
                  : "Not set",
                inline: true,
              },
              {
                name: "Notify Role",
                value: settings.notifyRole
                  ? `<@&${settings.notifyRole}>`
                  : "Not set",
                inline: true,
              },
              {
                name: "Exempt Roles",
                value: settings.exemptRoles.length
                  ? settings.exemptRoles.map((id) => `<@&${id}>`).join(", ")
                  : "None",
              },
              {
                name: "Exempt Channels",
                value: settings.exemptChannels.length
                  ? settings.exemptChannels.map((id) => `<#${id}>`).join(", ")
                  : "None",
              },
            ])
            .setTimestamp();

          await interaction.reply({ embeds: [embed], flags: 64 });
          logger.info(
            `Displayed anti-raid settings in ${interaction.guild.name}`,
          );
        } catch (error) {
          logger.error("Error displaying anti-raid settings:", error);
          throw error;
        }
        break;
      }
      case "lockdown": {
        try {
          const lockdownAction = interaction.options.getString("action");
          const reason =
            interaction.options.getString("reason") || "Manual lockdown";

          if (lockdownAction === "enable") {
            await RaidProtection.lockdownServer(
              interaction.guild,
              settings,
              reason,
            );
            interaction.client.antiRaid.isLocked.set(
              interaction.guild.id,
              true,
            );
            await interaction.reply({
              content:
                "Server has been locked down. Use `/antiraid lockdown action:disable` to end the lockdown.",
              flags: 64,
            });
            logger.info(
              `Server locked down in ${interaction.guild.name} for reason: ${reason}`,
            );
          } else {
            await RaidProtection.unlockServer(interaction.guild, settings);
            interaction.client.antiRaid.isLocked.delete(interaction.guild.id);
            await interaction.reply({
              content: "Server lockdown has been lifted.",
              flags: 64,
            });
            logger.info(`Server lockdown lifted in ${interaction.guild.name}`);
          }
        } catch (error) {
          logger.error("Error handling lockdown:", error);
          throw error;
        }
        break;
      }
      case "incidents": {
        try {
          const limit = interaction.options.getInteger("limit") || 10;
          const incidents = await db.getRaidIncidents(
            interaction.guild.id,
            limit,
          );

          if (!incidents.length) {
            await interaction.reply({
              content: "No raid incidents have been recorded.",
              flags: 64,
            });
            logger.info(
              `No raid incidents recorded in ${interaction.guild.name}`,
            );
            return;
          }

          const incidentEmbed = new EmbedBuilder()
            .setTitle("Recent Raid Incidents")
            .setColor("#FF0000")
            .setDescription(
              incidents
                .map(
                  (inc) =>
                    `**${inc.incident_type}** - ${new Date(inc.timestamp).toLocaleString()}\n` +
                    `• ${inc.details}\n` +
                    `• Action: ${inc.action_taken}\n` +
                    `• Affected Users: ${inc.affected_users.length}`,
                )
                .join("\n\n"),
            )
            .setTimestamp();

          await interaction.reply({ embeds: [incidentEmbed], flags: 64 });
          logger.info(
            `Displayed recent raid incidents in ${interaction.guild.name}`,
          );
        } catch (error) {
          logger.error("Error displaying raid incidents:", error);
          throw error;
        }
        break;
      }
      default: {
        logger.warn(`Unknown antiraid subcommand: ${subcommand}`);
        await interaction.reply({
          content: "Unknown subcommand.",
          flags: 64,
        });
      }
    }
  } catch (error) {
    logger.error("Error handling antiraid command:", error);
    if (!interaction.replied) {
      await interaction.reply({
        content: "An error occurred while processing the command.",
        flags: 64,
      });
    }
  }
}
