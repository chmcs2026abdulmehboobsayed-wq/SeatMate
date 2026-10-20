import Complaint from "../model/Complaint.js";
import Notification from "../model/Notification.js";

// 1. Submit a new complaint
export const createComplaint = async (req, res) => {
  try {
    const { subject, description, category } = req.body;
    const studentId = req.user?.id || req.user?._id;

    if (!studentId) {
      return res.status(401).json({
        message: "Please login first",
      });
    }

    if (!subject?.trim() || !description?.trim()) {
      return res.status(400).json({
        message: "Subject and description are required",
      });
    }

    const complaint = await Complaint.create({
      student: studentId,
      subject: subject.trim(),
      description: description.trim(),
      category: category || "Other",
    });

    return res.status(201).json({
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    console.error("Create complaint error:", error);

    return res.status(500).json({
      message: "Failed to submit complaint",
    });
  }
};

// 2. Get complaints of the logged-in student
export const getMyComplaints = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;

    if (!studentId) {
      return res.status(401).json({
        message: "Please login first",
      });
    }

    const complaints = await Complaint.find({
      student: studentId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ complaints });
  } catch (error) {
    console.error("Get complaints error:", error);

    return res.status(500).json({
      message: "Failed to fetch complaints",
    });
  }
};

// 3. Get all complaints (Admin)
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ complaints });
  } catch (error) {
    console.error("Get all complaints error:", error);

    return res.status(500).json({
      message: "Failed to fetch all complaints",
    });
  }
};

// 4. Update complaint status and admin response (Admin)
export const updateComplaint = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    const allowedStatuses = [
      "Pending",
      "In Progress",
      "Resolved",
    ];

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (
      status !== undefined &&
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid complaint status",
      });
    }

    const previousStatus = complaint.status;
    const previousResponse = complaint.adminResponse || "";

    if (status !== undefined) {
      complaint.status = status;
    }

    if (adminResponse !== undefined) {
      complaint.adminResponse = adminResponse;
    }

    await complaint.save();

    // Create notification when status or admin response changes
    const statusChanged =
      status !== undefined && status !== previousStatus;

    const responseChanged =
      adminResponse !== undefined &&
      adminResponse.trim() !== previousResponse.trim() &&
      adminResponse.trim() !== "";

    if (statusChanged || responseChanged) {
      try {
        let title = "Complaint Updated";
        let message = `Your complaint "${complaint.subject}" has been updated.`;

        if (statusChanged) {
          title = `Complaint ${complaint.status}`;

          message =
            `Your complaint "${complaint.subject}" status changed ` +
            `from ${previousStatus} to ${complaint.status}.`;
        }

        if (responseChanged) {
          message += ` Admin response: ${adminResponse.trim()}`;
        }

        await Notification.create({
          recipient: complaint.student,
          title,
          message,
          type: responseChanged
            ? "complaint_response"
            : "complaint_status",
          relatedId: complaint._id,
        });
      } catch (notificationError) {
        // Keep complaint updates successful even if notification fails.
        console.error(
          "Complaint notification error:",
          notificationError
        );
      }
    }

    return res.status(200).json({
      message: "Complaint updated successfully",
      complaint,
    });
  } catch (error) {
    console.error("Update complaint error:", error);

    return res.status(500).json({
      message: "Failed to update complaint",
    });
  }
};