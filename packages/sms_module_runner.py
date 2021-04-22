from querybuilder.query import Query
from django.db import connections
import mysql.connector
import os
from dotenv import load_dotenv
import asyncio
import logging
import datetime;
import json
import requests;
import pymysql;

load_dotenv(dotenv_path="../.env")

db_host_live = os.environ.get("DB_HOST_LIVE");

loop = asyncio.get_event_loop()
logging.basicConfig(filename='sms.log', encoding='utf-8', level=logging.DEBUG);

sms_port = json.loads(os.environ.get("SMS_PORT"));
sms_send_links = []

for per in sms_port:
    sms_send_links.append({
        "url": "http://localhost:" + str(per) + "/http/send-message?",
        "username": os.environ.get("SMS_USER"),
        "password": os.environ.get("SMS_PASSWORD"),
        "port" : per
    })
    pass


def set_timezone(cnx):

    # Get a cursor
    cur = cnx.cursor()

    # Execute a query

    cur.execute("SET time_zone='+08:00'")
    cur.close()
    pass;

def get_pending_sms(cnx):
    # Get a cursor
    cur = cnx.cursor()

    # Execute a query
    cur.execute("""
    SELECT 
	    sms_group.id,
        sms_members.hds_id,
        sms_members.id,
	    sms_group.start_date,
        sms_group.message,
        hugpong_member.contact,
        hugpong_member.mem_fname,
        hugpong_member.mem_lname,
        hugpong_member.mem_mname,
        sms_members.date_send_confirm,
        sms_members.sms_id,
        sms_members.server_port,
        sms_members.attempt
    FROM sms_group 
    LEFT JOIN sms_members ON sms_members.sms_group_id = sms_group.id
    LEFT JOIN hugpong_member ON hugpong_member.hds_mem_id = sms_members.hds_id
    where (sms_members.date_send_confirm = "0000-00-00" || sms_members.date_send_confirm is null)
    and sms_group.start_date <= now()
    and sms_members.is_disabled = 0
    and (hugpong_member.contact is not null || hugpong_member.contact != "")
    """)

    data = cur.fetchall();
    cur.close();

    return data;

    pass;

def disabled_sms_que(sms_member_id, cnx):

    print("Disabled sms status... for %s" % str(sms_member_id));

    # Get a cursor
    cur = cnx.cursor()

    today = datetime.datetime.today()
    current_date = today.strftime("%Y-%m-%d")

    query = "UPDATE `sms_members` " \
            "SET `is_disabled` = '1', " \
            "`sms_id` = '-1', " \
            "`date_send_confirm`='%s'  " \
            "WHERE `id` = '%s'" % (str(current_date),str(sms_member_id));

    cur.execute(query);
    # Fetch one result
    cnx.commit()

    print("Successfully disabled sms on id:%s" % str(sms_member_id))

    pass;


def confirm_sms_send(sms_id, cnx):

    print("Updating sms status... for %s" % str(sms_id));

    # Get a cursor
    cur = cnx.cursor()

    today = datetime.datetime.today()
    current_date = today.strftime("%Y-%m-%d %H:%M:%S")

    query = "UPDATE `sms_members` " \
            "SET `date_send_confirm` = '%s' " \
            "WHERE `sms_id` = '%s'" % (str(current_date), str(sms_id));

    cur.execute(query);
    # Fetch one result
    cnx.commit()

    print("Successfully send sms on id:%s" % str(sms_id))


    pass;

def remove_in_que(sms_id, cnx):

    print("Removing the que... for %s" % str(sms_id));

    # Get a cursor
    cur = cnx.cursor()

    query = "UPDATE `sms_members` SET `server_port` = null, `sms_id` = null WHERE `sms_id` = '%s'" % (str(sms_id));

    cur.execute(query);
    # Fetch one result
    cnx.commit()

    print("Successfully Removing the que... for %s" % str(sms_id));

    pass;

def sms_log_status_update(details, status_defination ,cnx):

    sms_id = details['_sms_id'];

    print("Updating log status... for %s" % str(sms_id));

    # Get a cursor
    cur = cnx.cursor()

    query = "UPDATE `sms_members` SET " \
            "`latest_status_txt` = '%s' " \
            "WHERE `sms_id` = '%s'" % (
        status_defination,
        str(sms_id))

    cur.execute(query);
    # Fetch one result
    cnx.commit()

    print("Successfully updated id:%s" % str(sms_id))

def sms_log_update(details, result,sms_port,cnx):

    sms_member_id = details['sms_members_id'];
    attempt = details['attempt'];

    result = str(result).replace("OK:", "")
    result = str(result).replace(" ", "")

    # Get a cursor
    cur = cnx.cursor()

    today = datetime.datetime.today()
    current_date = today.strftime("%Y-%m-%d %H:%M:%S")

    query = "UPDATE `sms_members` " \
            "SET `sms_id` = '%s', " \
            "`start` = '%s', " \
            "`server_port` = '%s', " \
            "`attempt` = '%s' " \
            "WHERE (`id` = '%s');" % (
        result,
        str(current_date),
        sms_port ,
        int(attempt) + 1,
        str(sms_member_id)
    );

    cur.execute(query);
    # Fetch one result
    cnx.commit()
    print("Successfully updated id:%s" % str(sms_member_id))

pass;


def message_format(message, data):

    for per in data.keys():
        str_up = str(per).upper()
        value = data[per]

        message = str(message).replace("<" + str_up + "_upper>", str(value).upper())
        message = str(message).replace("<" + str_up + "_lower>", str(value).lower())
        message = str(message).replace("<" + str_up + ">", str(value))

        pass;
    return message;

    pass;



def check_que_sms_status(details, cnx):

    port = details['_sms_port']
    sms_id = details['_sms_id']

    print("http://localhost:" + str(port) + "/http/request-status-update?")

    url = "http://localhost:" + str(port) + "/http/request-status-update?";
    r = requests.get(url, params={
        "username": os.environ.get("SMS_USER"),
        "password": os.environ.get("SMS_PASSWORD"),
        "message-id" : sms_id
     });

    result = r.text

    sms_log_status_update(details, result, cnx);

    if str(result).find("STATUS:300") != -1:

        remove_in_que(sms_id, cnx);

    if str(result).find("STATUS:200") != -1:

        confirm_sms_send(sms_id, cnx)

        pass

        pass;

    pass;

def process_send(cnx):

    def reload():
        return process_send(cnx);
        pass;

    try:

        data = get_pending_sms(cnx);

        print("Found items " + str(len(data)));
        logging.info(str(datetime.datetime.now()) + " - " + "Found items " + str(len(data)));

        if len(data) <= 0:

            print("NO DATA FOUND IN SERVER");
            logging.info(str(datetime.datetime.now()) + " - " + "NO DATA FOUND IN SERVER");

            return loop.call_later(10, body)
            pass;

        def send(info, index, link_index = 0):

            info = info[index]

            details = {
                "sms_group_id" : info[0],
                "hds_id" : info[1],
                "sms_members_id" : info[2],
                "start_date" : info[3],
                "message" : info[4],
                "contact" : info[5],
                "firstname" : str(info[6]).capitalize(),
                "lastname" : str(info[7]).capitalize(),
                "middlename" : str(info[8]).capitalize(),
                "_date_confirm" : info[9],
                "_sms_id" : info[10],
                "_sms_port" : info[11],
                "attempt" : info[12]
            }

            if details['contact']:
                details['contact'] = "+63" + str(details['contact'])

            details['name'] = " ".join([
                details['firstname'],
                details['lastname']
            ]);

            print("Procces items for " + str(details['contact']) );
            logging.info(str(datetime.datetime.now()) + " - " + "Procces items for " + str(details['contact']));

            if details['_sms_id'] and details['_sms_port'] and not details['_date_confirm']:

                print("Que process update status..");
                check_que_sms_status(details, cnx);


            elif not details['_sms_id'] and details['contact']:

                print("Que identified not sent");

                if (len(sms_send_links) - 1) <= link_index:
                    link_index = 0

                    server_select = sms_send_links[link_index];

                    #SENDING SMS

                    r = requests.get(server_select["url"], params={
                        "username": server_select['username'],
                        "password": server_select['password'],
                        "to": "+639093522667",
                        "message": message_format(details['message'], details)
                    });

                    result = r.text;

                    if str(result).find("ERROR") != -1:
                        print(result)
                        logging.info(str(datetime.datetime.now()) + " - " + result);
                        return loop.call_later(30, reload)
                        pass;

                    print("Sending que added...");

                    sms_log_update(details,result,server_select["port"],cnx);
                    pass;

            else:
                disabled_sms_que(details['sms_members_id'], cnx)
                pass;


            #------------- load next que -------------

            index = index + 1;
            link_index = link_index + 1;

            if index < (len(data) -1) :

                def load():
                    print("Que process");
                    send(data, index, link_index);
                    pass;

                return loop.call_later(10, load)

            else:
                return process_send(cnx);
                pass;

            pass;

        send(data, 0);



    except mysql.connector.errors.ProgrammingError as e:

        print("(1)" + str(e));

        logging.error(str(datetime.datetime.now()) + " - " + str(e));

        return loop.call_later(10, reload);

        pass;

    pass;


def body():
    try:

        print("Connecting to my sql")
        logging.info(str(datetime.datetime.now()) + " - " + "Attempting to connecting to database");

        # Connect to server
        cnx = mysql.connector.connect(
            host=os.environ.get("DB_HOST_LIVE"),
            user=os.environ.get("DB_USER_LIVE"),
            password=os.environ.get("DB_PASSWORD_LIVE"),
            database=os.environ.get("DB_DATABASE_LIVE")
        )

        set_timezone(cnx);

        print("Connected to my sql")
        logging.info(str(datetime.datetime.now()) + " - " + "Connected to database");

        process_send(cnx);

        pass;

    except mysql.connector.errors.InterfaceError as e:
        print(e);
        logging.error(str(datetime.datetime.now()) + " - " + str(e));
        loop.call_later(20, body)
        pass;

    pass;


async def main():
    while True:
        await asyncio.sleep(1)


body();
loop.run_until_complete(main())
