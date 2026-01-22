import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  updateProfile,
  changePassword,
  getDocuments,
  upsertDocument,
  deleteDocument,
} from "@/lib/profile";
import { Edit, Lock, FileText, Trash2, Plus, Save } from "lucide-react";

export default function ProfileTab() {
  const { user, refresh } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    gender: "other",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [editingDocType, setEditingDocType] = useState(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentLoading, setDocumentLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        phone: user.phone?.replace(/^\+91/, "") || "",
        gender: user.gender || "other",
      });
    }
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "We couldn't load your documents.",
      );
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setProfileLoading(true);
      await updateProfile({
        name: profileData.name,
        phone: `+91${profileData.phone}`,
        gender: profileData.gender,
      });
      toast.success("Your profile has been updated.");
      setEditMode(false);
      await refresh();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "We couldn't update your profile.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    try {
      setPasswordLoading(true);
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("Your password has been updated.");
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "We couldn't change your password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveDocument = async () => {
    try {
      setDocumentLoading(true);
      await upsertDocument({
        documentType: editingDocType,
        documentNumber: documentNumber.toUpperCase(),
      });
      toast.success("Document saved.");
      setShowDocumentDialog(false);
      setDocumentNumber("");
      loadDocuments();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "We couldn't save this document.",
      );
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleDeleteDocument = async (docType) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(docType);
      toast.success("Document deleted.");
      loadDocuments();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "We couldn't delete this document.",
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="rounded-2xl sm:rounded-3xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Personal Information
              </CardTitle>
              <CardDescription className="text-sm">
                Update your personal details
              </CardDescription>
            </div>
            {!editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="w-full sm:w-auto"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              disabled={!editMode}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Input value="+91" disabled className="w-20" />
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    phone: e.target.value.replace(/[^0-9]/g, ""),
                  })
                }
                disabled={!editMode}
                maxLength={10}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <RadioGroup
              value={profileData.gender}
              onValueChange={(value) =>
                setProfileData({ ...profileData, gender: value })
              }
              disabled={!editMode}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" disabled={!editMode} />
                <Label htmlFor="male" className={!editMode ? "opacity-50" : ""}>
                  Male
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="female"
                  id="female"
                  disabled={!editMode}
                />
                <Label
                  htmlFor="female"
                  className={!editMode ? "opacity-50" : ""}
                >
                  Female
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" disabled={!editMode} />
                <Label
                  htmlFor="other"
                  className={!editMode ? "opacity-50" : ""}
                >
                  Other
                </Label>
              </div>
            </RadioGroup>
          </div>
          {editMode && (
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                onClick={handleUpdateProfile}
                disabled={profileLoading}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {profileLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setProfileData({
                    name: user?.name || "",
                    phone: user?.phone?.replace(/^\+91/, "") || "",
                    gender: user?.gender || "other",
                  });
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl sm:rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Security</CardTitle>
          <CardDescription className="text-sm">
            Manage your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShowPasswordDialog(true)}
            className="w-full sm:w-auto"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl sm:rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Travel Documents</CardTitle>
          <CardDescription className="text-sm">
            Manage your Aadhar and Passport
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {["aadhar", "passport"].map((docType) => {
            const doc = documents.find((d) => d.documentType === docType);
            return (
              <div
                key={docType}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-xl sm:rounded-2xl"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold capitalize text-sm sm:text-base">
                      {docType === "aadhar" ? "Aadhar Card" : "Passport"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {doc ? doc.documentNumber : "Not added"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDocType(docType);
                      setDocumentNumber(doc?.documentNumber || "");
                      setShowDocumentDialog(true);
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    {doc ? (
                      <>
                        <Edit className="w-4 h-4 sm:mr-0" />
                        <span className="ml-2 sm:hidden">Edit</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 sm:mr-0" />
                        <span className="ml-2 sm:hidden">Add</span>
                      </>
                    )}
                  </Button>
                  {doc && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDocument(docType)}
                      className="flex-1 sm:flex-none"
                    >
                      <Trash2 className="w-4 h-4 sm:mr-0" />
                      <span className="ml-2 sm:hidden">Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Update your account password</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="w-full sm:w-auto"
            >
              {passwordLoading ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDocType === "aadhar" ? "Aadhar Card" : "Passport"}
            </DialogTitle>
            <DialogDescription>Enter your document number</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documentNumber">Document Number</Label>
              <Input
                id="documentNumber"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder={
                  editingDocType === "aadhar"
                    ? "12 digits"
                    : "1 letter + 7 digits (e.g., A1234567)"
                }
                maxLength={editingDocType === "aadhar" ? 12 : 8}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDocumentDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDocument}
              disabled={documentLoading}
              className="w-full sm:w-auto"
            >
              {documentLoading ? "Saving..." : "Save Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
