from flask import Flask, request, redirect, url_for, render_template,flash
import json
from uuid import uuid4
from cauli.FaceDescriptor import *
from cauli.VideoIndexer import VideoIndexer
import string
import random
app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    """Handle the upload of a file."""
    form = request.form
    query_type = form.get("radio")
    # Create a unique "session ID" for this particular batch of uploads.
    upload_key = str(uuid4())

    # Is the upload using Ajax, or a direct POST by the form?
    is_ajax = False
    if form.get("__ajax", None) == "true":
        is_ajax = True

    # Target folder for these uploads.
    target = "uploadr/static/uploads/{}".format(upload_key)
    try:
        os.mkdir(target)
    except:
        if is_ajax:
            return ajax_response(False, "Couldn't create upload directory: {}".format(target))
        else:
            return "Couldn't create upload directory: {}".format(target)

    print("=== Form Data ===")
    for key, value in list(form.items()):
        print(key, "=>", value)

    for upload in request.files.getlist("file"):
        filename = upload.filename.rsplit("/")[0]
        destination = "/".join([target, filename])
        print("Accept incoming file:", filename)
        print("Save it to:", destination)
        upload.save(destination)

    if is_ajax:
        return ajax_response(True, upload_key,query_type)
    else:
        return redirect(url_for("upload_complete", uuid=upload_key))


@app.route("/files/<uuid>")
def filter_videos(uuid):
    """The location we send them to at the end of the upload."""
    query_type = request.args.get('query_type')
    q = []
    directory = "uploadr/static/uploads/" + uuid + "/"
    for file in os.listdir(directory):
        p = FaceDescriptor(directory + file).getDescriptor()
        q.append(p)

    result = {}
    data = {}

    try:
        result = VideoIndexer("/home/buddha/thesis/cauli/data/").search(q, query_type)
    except:
        flash('There was error while processing request')

    print("Result : ",result)

    # returns video number and intervals, eg:{5:[[1.23,4.123],[6.234,[7.345]]}
    for video_num, value in result.items():
        video_num = str(video_num)
        marker_list = []

        video_path = ''
        #search the name of the video, which always has format: video_num/*.track.mp4
        for file in os.listdir("uploadr/static/" + video_num):
            print("Video num : ",video_num)
            if file.endswith(".track.mp4"):
                video_path = video_num + "/" + file

        #exception handling
        if video_path == '':
            return render_template("exception.html")

        # if query_type is not interval, then value will be either True or False
        if query_type != "interval":

            #if the value is True, then only insert the video info
            if value:
                data[generate_random_str()] = {"video_path":video_path}
        else:

            # videojs accepts markets as list of dictionary eg : [{'time':start_time, 'duration':length},{...}]
            for start, end in value:
                markers = {'time': float(start),
                           'duration': float(end) - float(start)}
                marker_list.append(markers)

            if value != []:
                data[generate_random_str()] = {"video_path":video_path,"markers":marker_list}

    print("Final data structure : ", data)

    return render_template("marker-test.html",video_list=data)


# @app.route("/files/<uuid>")
# def upload_complete(uuid):
#     """The location we send them to at the end of the upload."""
#
#     # Get their files.
#     root = "uploadr/static/uploads/{}".format(uuid)
#     if not os.path.isdir(root):
#         return "Error: UUID not found!"
#
#     files = []
#     for file in glob.glob("{}/*.*".format(root)):
#         fname = file.split(os.sep)[-1]
#         files.append(fname)
#
#     return render_template("files.html",
#         uuid=uuid,
#         files=files,
#     )

def generate_random_str():
    return ''.join(random.choice(string.ascii_uppercase) for _ in range(10))

def ajax_response(status, msg,query_type):
    status_code = "ok" if status else "error"
    return json.dumps(dict(
        status=status_code,
        msg=msg,
        query_type = query_type
    ))
