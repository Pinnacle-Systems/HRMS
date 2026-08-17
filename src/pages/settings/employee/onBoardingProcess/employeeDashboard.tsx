import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	Grid,
	Typography,
	Chip,
	LinearProgress,
	Button,
	Dialog,
	DialogContent,
	DialogActions,
	DialogTitle,
	IconButton,
	TextField,
	Box,
	Tooltip,
	Alert,
	Avatar,
	Paper,
	Collapse,
	CircularProgress,
	Fade,
	Zoom,
} from "@mui/material";
import {
	CheckCircle as CheckCircleIcon,
	Pending as PendingIcon,
	Schedule as ScheduleIcon,
	Warning as WarningIcon,
	Description as DescriptionIcon,
	Close as CloseIcon,
	Download as DownloadIcon,
	EmojiEvents as TrophyIcon,
	Person as PersonIcon,
	Assignment as AssignmentIcon,
	AttachFile as AttachFileIcon,
	KeyboardArrowDown as KeyboardArrowDownIcon,
	AccessTime as AccessTimeIcon,
	Star as StarIcon,
	Verified as VerifiedIcon,
	CheckCircleOutlined,
	EmailOutlined,
	KeyboardArrowUp,
	UploadOutlined,
} from "@mui/icons-material";
import {
	onBoardService,
	type AssignedTaskDetail,
} from "../../../../services/modules/onBoard";
import { useUI } from "../../../../context/Snackbar";
import dayjs from "dayjs";
import type { OnboardingProgress } from "./type";
import { formatDateTime } from "../../../../utils/dateFormatter";

interface EmployeeDashboardProps {
	employeeId: string;
}

export const EmployeeDashboard = ({ employeeId }: EmployeeDashboardProps) => {
	const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
	const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);
	const [selectedTask, setSelectedTask] = useState<AssignedTaskDetail | null>(
		null,
	);
	const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
	const [taskNotes, setTaskNotes] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isCompleting, setIsCompleting] = useState(false);
	const [showCompletionDialog, setShowCompletionDialog] = useState(false);
	const [expandedChecklist, setExpandedChecklist] = useState<string | null>(
		null,
	);
	const [hoveredTask, setHoveredTask] = useState<string | null>(null);

	const fetchOnboardingProgress = async () => {
		showSpinner();
		if (!employeeId) return;
		try {
			const response: any = await onBoardService.getProgress(employeeId);
			setOnboarding(response.data);
		} catch (error: any) {
			showSnackbar(error.message, "error");
		} finally {
			hideSpinner();
		}
	};

	useEffect(() => {
		if (employeeId) {
			fetchOnboardingProgress();
		}
	}, []);

	const handleCompleteTask = async (task: AssignedTaskDetail) => {
		setSelectedTask(task);
		setTaskNotes("");
		setIsCompleteDialogOpen(true);
	};

	const handleConfirmComplete = async () => {
		if (!selectedTask?.taskInstanceId && !selectedTask?.id) {
			showSnackbar("Task ID is missing", "error");
			return;
		}

		try {
			setIsCompleting(true);
			showSpinner();
			await onBoardService.completeTask(
				selectedTask?.taskInstanceId || selectedTask?.id || "",
				{ notes: taskNotes, status: "COMPLETED" },
			);
			showSnackbar("Task completed successfully!", "success");
			setIsCompleteDialogOpen(false);
			setSelectedTask(null);
			setTaskNotes("");
			await fetchOnboardingProgress();

			if (onboarding) {
				const allTasksCompleted = onboarding.checklists?.every((checklist) =>
					checklist.tasks?.every((task: any) => task.status === "COMPLETED"),
				);
				if (allTasksCompleted && onboarding.totalChecklists > 0) {
					setShowCompletionDialog(true);
				}
			}
		} catch (error: any) {
			showSnackbar(error.message, "error");
		} finally {
			setIsCompleting(false);
			hideSpinner();
		}
	};

	const handleUploadDocument = (task: AssignedTaskDetail) => {
		setSelectedTask(task);
		setSelectedFile(null);
		setUploadProgress(0);
		setIsUploadDialogOpen(true);
	};

	const handleConfirmUpload = async () => {
		if (!selectedFile) {
			showSnackbar("Please select a file", "error");
			return;
		}

		if (!selectedTask?.taskInstanceId && !selectedTask?.id) {
			showSnackbar("Task ID is missing", "error");
			return;
		}

		try {
			showSpinner();
			await onBoardService.createDocument({
				file: selectedFile,
				taskInstanceId: selectedTask?.taskInstanceId || selectedTask?.id || "",
				employeeId: employeeId,
				// notes: `Uploaded for task: ${selectedTask?.title || selectedTask?.taskName}`,
			});
			showSnackbar("Document uploaded successfully! 📄", "success");
			setIsUploadDialogOpen(false);
			setSelectedFile(null);
			setUploadProgress(0);
			await fetchOnboardingProgress();
		} catch (error: any) {
			showSnackbar(error.message, "error");
		} finally {
			hideSpinner();
		}
	};

	const handleCompleteOnboarding = async () => {
		if (!onboarding?.onboardingId) {
			showSnackbar("Onboarding ID is missing", "error");
			return;
		}
		showConfirmDialog({
			title: "Complete Onboarding",
			message:
				"Congratulations! You've completed all your onboarding tasks. Are you ready to complete the onboarding process?",
			confirmText: "Yes, Complete!",
			onConfirm: async () => {
				// try {
				//   showSpinner();
				//   await onBoardService.completeOnboarding(onboarding.onboardingId);
				//   showSnackbar("🎉 Onboarding completed successfully!", "success");
				//   setShowCompletionDialog(false);
				//   await fetchOnboardingProgress();
				// } catch (error: any) {
				//   showSnackbar(error.message, "error");
				// } finally {
				//   hideSpinner();
				// }
			},
		});
	};

	const handleDownloadCertificate = async () => {
		if (!onboarding?.onboardingId) {
			showSnackbar("Onboarding ID is missing", "error");
			return;
		}
		// try {
		//   showSpinner();
		//   const response: any = await onBoardService.downloadCompletionCertificate(
		//     onboarding.onboardingId,
		//   );
		//   const url = window.URL.createObjectURL(new Blob([response.data]));
		//   const link = document.createElement("a");
		//   link.href = url;
		//   link.setAttribute(
		//     "download",
		//     `onboarding-certificate-${dayjs().format("YYYY-MM-DD")}.pdf`,
		//   );
		//   document.body.appendChild(link);
		//   link.click();
		//   link.remove();
		//   showSnackbar("Certificate downloaded successfully! 📜", "success");
		// } catch (error: any) {
		//   showSnackbar(error.message, "error");
		// } finally {
		//   hideSpinner();
		// }
	};

	// const getStatusIcon = (status: string) => {
	//     switch (status?.toUpperCase()) {
	//         case "COMPLETED":
	//             return <CheckCircleIcon className="text-green-500" />;
	//         case "IN_PROGRESS":
	//             return <ScheduleIcon className="text-blue-500" />;
	//         case "OVERDUE":
	//             return <WarningIcon className="text-red-500" />;
	//         default:
	//             return <PendingIcon className="text-orange-500" />;
	//     }
	// };

	const getStatusColor = (
		status: string,
	): "success" | "info" | "error" | "warning" | "default" => {
		switch (status?.toUpperCase()) {
			case "COMPLETED":
				return "success";
			case "IN_PROGRESS":
				return "info";
			case "OVERDUE":
				return "error";
			case "PENDING":
				return "warning";
			default:
				return "default";
		}
	};

	const getStatusDisplay = (status: string) => {
		const map: Record<string, string> = {
			IN_PROGRESS: "In Progress",
			COMPLETED: "Completed",
			OVERDUE: "Overdue",
			PENDING: "Pending",
			SCHEDULED: "Scheduled",
		};
		return map[status?.toUpperCase()] || status || "—";
	};

	const isAllCompleted = () => {
		if (!onboarding) return false;
		return (
			onboarding.checklists?.every((checklist) =>
				checklist.tasks?.every((task: any) => task.status === "COMPLETED"),
			) && onboarding.totalChecklists > 0
		);
	};

	const handleToggleChecklist = (checklistId: string) => {
		setExpandedChecklist(
			expandedChecklist === checklistId ? null : checklistId,
		);
	};

	if (!onboarding) {
		return (
			<Box className="flex justify-center items-center h-[60vh]">
				<Fade in timeout={600}>
					<Box className="text-center">
						<Box className="relative inline-block mb-5">
							{/* <CircularProgress size={48} className="text-primary" /> */}
							<Box className="absolute inset-0 flex items-center justify-center">
								<AssignmentIcon className="text-gray-500 !w-8 !h-8" />
							</Box>
						</Box>
						<Typography
							variant="body1"
							className="text-gray-500 mt-4 font-medium"
						>
							Onboarding tasks...
						</Typography>
						<Typography variant="caption" className="text-gray-400">
							{/* Please wait while we fetch your progress */}
							No Onborading found for You!
						</Typography>
					</Box>
				</Fade>
			</Box>
		);
	}

	const allCompleted = isAllCompleted();

	const totalTasks =
		onboarding.checklists?.reduce((acc, c) => acc + c.totalTasks, 0) || 0;
	const completedTasks =
		onboarding.checklists?.reduce((acc, c) => acc + c.completedTasks, 0) || 0;
	const pendingTasks = totalTasks - completedTasks;

	return (
		<Box className="mt-4">
			{/* ============ PREMIUM WELCOME HEADER ============ */}
			<Card className="!rounded-xl !shadow-lg !border-0 mb-4 overflow-hidden relative !bg-white">
				{/* Decorative Background Elements */}
				{/* <Box className="absolute inset-0 pointer-events-none">
                    <Box className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-primary/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
                    <Box className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-100/30 to-indigo-100/30 rounded-full blur-2xl -translate-x-24 translate-y-24" />
                    <Box className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-2xl" />
                </Box> */}

				<CardContent className="!py-4 !px-6 relative">
					<div className="flex items-center justify-between">
						{/* Left Section - User Info */}
						<Grid size={{ xs: 12, lg: 7 }}>
							<Box className="flex items-center gap-5">
								{/* Avatar with Status Ring */}
								<Box className="relative flex-shrink-0">
									<Box className="relative">
										<Avatar className="!w-16 !h-16 bg-primary text-white !text-3xl font-bold">
											{onboarding.employeeName?.charAt(0) || "U"}
										</Avatar>
										{/* Online Status Indicator */}
										<Box className="absolute bottom-[6px] right-[10px]">
											<Box className="relative">
												<Box className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-white shadow-md" />
												<Box className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
											</Box>
										</Box>
									</Box>
									{/* Progress Ring */}
									{/* <Box className="absolute -top-1 -right-1">
                                        <Box className="relative w-8 h-8">
                                            <CircularProgress
                                                variant="determinate"
                                                value={onboarding.overallProgressPercent}
                                                size={32}
                                                thickness={4}
                                                sx={{
                                                    color: onboarding.overallProgressPercent === 100 ? "#22c55e" : "#3b82f6",
                                                    "& .MuiCircularProgress-circle": {
                                                        strokeLinecap: "round",
                                                    },
                                                }}
                                            />
                                            <Box className="absolute inset-0 flex items-center justify-center">
                                                <Typography variant="caption" className="text-[8px] font-bold text-gray-600">
                                                    {onboarding.overallProgressPercent}%
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box> */}
								</Box>

								{/* User Details */}
								<Box className="flex-1 min-w-0">
									<Box className="flex items-center gap-2 flex-wrap">
										<Typography
											variant="h5"
											className="font-bold text-gray-800"
										>
											Welcome back, {onboarding.employeeName}
										</Typography>
										{allCompleted && (
											<Chip
												icon={<VerifiedIcon className="!w-4 !h-4" />}
												label="Completed"
												color="success"
												size="small"
												className="!h-6 !rounded-full !text-[10px] font-medium"
											/>
										)}
									</Box>

									<Typography variant="body2" className="text-gray-500 !mt-0.5">
										Here's your onboarding progress at a glance
									</Typography>

									{/* Employee Info Chips */}
									<Box className="flex flex-wrap items-center gap-2 mt-3">
										<Chip
											icon={<PersonIcon className="!w-3 !h-3 !text-gray-800" />}
											label={onboarding.employeeCode}
											size="small"
											variant="outlined"
											className="!h-5 text-gray-800"
										/>
										<Chip
											icon={
												<EmailOutlined className="!w-3 !h-3 !text-gray-800" />
											}
											label={onboarding.employeeEmail}
											size="small"
											variant="outlined"
											className="!h-5 text-gray-800"
										/>
										<Chip
											icon={
												<AccessTimeIcon className="!w-3 !h-3 !text-gray-800" />
											}
											label={`Joined ${dayjs(onboarding.assignedAt).format("DD MMM YYYY")}`}
											size="small"
											variant="outlined"
											className="!h-5 text-gray-800"
										/>
										<Chip
											label={getStatusDisplay(onboarding.overallStatus)}
											color={getStatusColor(onboarding.overallStatus)}
											size="small"
											className="!h-5 text-gray-800"
										/>
									</Box>
								</Box>
							</Box>
						</Grid>

						{/* Right Section - Actions */}
						<Grid size={{ xs: 12, lg: 5 }}>
							<Box className="flex flex-col items-end gap-3">
								{allCompleted ? (
									// Completion Actions
									<Box className="flex flex-wrap items-center justify-end gap-2 w-full">
										<Button
											variant="contained"
											color="success"
											size="small"
											startIcon={<DownloadIcon />}
											onClick={handleDownloadCertificate}
										// className="!normal-case !rounded-full !px-6 !py-2.5 !shadow-lg !shadow-green-600/20 hover:!shadow-xl hover:!shadow-green-600/30 transition-all"
										>
											Download Certificate
										</Button>
										<Button
											variant="contained"
											onClick={handleCompleteOnboarding}
											size="small"
											startIcon={<TrophyIcon />}
										// className="!bg-primary !normal-case !rounded-full !px-6 !py-2.5 !shadow-lg !shadow-primary/20 hover:!shadow-xl hover:!shadow-primary/30 transition-all"
										>
											Complete Onboarding
										</Button>
									</Box>
								) : (
									// Progress Display
									<Box className="backdrop-blur-sm rounded-2xl px-6 py-3 shadow-sm border border-gray-200 w-full max-w-[200px]">
										<Box className="flex items-center justify-between mb-1">
											<Typography
												variant="caption"
												className="text-gray-500 font-medium"
											>
												Overall Progress
											</Typography>
											<Typography
												variant="h5"
												className="font-bold text-primary"
											>
												{onboarding.overallProgressPercent}%
											</Typography>
										</Box>
										<LinearProgress
											variant="determinate"
											value={onboarding.overallProgressPercent}
											className="h-1.5 rounded-full"
											sx={{
												backgroundColor: "#e5e7eb",
												"& .MuiLinearProgress-bar": {
													backgroundColor:
														onboarding.overallProgressPercent === 100
															? "#22c55e"
															: "#3b82f6",
													borderRadius: "999px",
												},
											}}
										/>
										<Box className="flex justify-between mt-1">
											<Typography
												variant="caption"
												className="text-gray-400 text-[10px]"
											>
												{completedTasks}/{totalTasks} tasks
											</Typography>
											<Typography
												variant="caption"
												className="text-gray-400 text-[10px]"
											>
												{pendingTasks} remaining
											</Typography>
										</Box>
									</Box>
								)}

								{/* Quick Stats Row */}
								<Box className="flex items-center gap-3 mt-1">
									<Box className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full">
										<AssignmentIcon className="!w-4 !h-4 text-blue-600" />
										<Typography
											variant="caption"
											className="font-medium text-blue-700 text-[10px]"
										>
											{totalTasks} Tasks
										</Typography>
									</Box>
									<Box className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
										<CheckCircleIcon className="!w-4 !h-4 text-green-600" />
										<Typography
											variant="caption"
											className="font-medium text-green-700 text-[10px]"
										>
											{completedTasks} Done
										</Typography>
									</Box>
									{pendingTasks > 0 && (
										<Box className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full">
											<PendingIcon className="!w-4 !h-4 text-orange-600" />
											<Typography
												variant="caption"
												className="font-medium text-orange-700 text-[10px]"
											>
												{pendingTasks} Pending
											</Typography>
										</Box>
									)}
								</Box>
							</Box>
						</Grid>
					</div>
				</CardContent>
			</Card>

			{/* ============ PREMIUM STATS CARDS ============ */}
			{/* <Grid container spacing={3} className="mb-6">
                {[
                    {
                        title: "Total Tasks",
                        value: totalTasks,
                        icon: <AssignmentIcon />,
                        color: "#3b82f6",
                        bg: "bg-blue-50",
                        sub: `${completedTasks} completed · ${pendingTasks} pending`,
                        progress: (completedTasks / totalTasks) * 100,
                    },
                    {
                        title: "Checklists",
                        value: `${onboarding.completedChecklists}/${onboarding.totalChecklists}`,
                        icon: <FolderIcon />,
                        color: "#22c55e",
                        bg: "bg-green-50",
                        sub: `${onboarding.completedChecklists} completed out of ${onboarding.totalChecklists}`,
                        progress:
                            (onboarding.completedChecklists / onboarding.totalChecklists) *
                            100,
                    },
                    {
                        title: "Progress",
                        value: `${onboarding.overallProgressPercent}%`,
                        icon: <TrendingUpIcon />,
                        color: "#8b5cf6",
                        bg: "bg-purple-50",
                        sub: allCompleted ? "All tasks completed!" : "In progress",
                        progress: onboarding.overallProgressPercent,
                    },
                    {
                        title: "Status",
                        value: getStatusDisplay(onboarding.overallStatus),
                        icon: <ScheduleIcon />,
                        color: "#f59e0b",
                        bg: "bg-orange-50",
                        sub: allCompleted ? "✅ All done!" : "Keep going!",
                        progress: onboarding.overallProgressPercent,
                        chip: true,
                    },
                ].map((stat, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                        <Zoom in timeout={300 + idx * 100}>
                            <Card className="!rounded-2xl !shadow-md !border-0 hover:!shadow-xl transition-all duration-300 hover:-translate-y-1">
                                <CardContent className="!p-5">
                                    <Box className="flex items-start justify-between">
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]"
                                            >
                                                {stat.title}
                                            </Typography>
                                            <Typography
                                                variant="h4"
                                                className="font-bold text-gray-800 mt-1"
                                                style={{ color: stat.color }}
                                            >
                                                {stat.value}
                                            </Typography>
                                        </Box>
                                        <Box
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                            style={{
                                                backgroundColor: alpha(stat.color, 0.1),
                                                color: stat.color,
                                            }}
                                        >
                                            {stat.icon}
                                        </Box>
                                    </Box>

                                    {!stat.chip && (
                                        <>
                                            <LinearProgress
                                                variant="determinate"
                                                value={stat.progress || 0}
                                                className="mt-3 h-1.5 rounded-full"
                                                sx={{
                                                    backgroundColor: "#e5e7eb",
                                                    "& .MuiLinearProgress-bar": {
                                                        backgroundColor: stat.color,
                                                    },
                                                }}
                                            />
                                            <Typography
                                                variant="caption"
                                                className="text-gray-400 mt-1 block"
                                            >
                                                {stat.sub}
                                            </Typography>
                                        </>
                                    )}

                                    {stat.chip && (
                                        <Box className="mt-2">
                                            <Chip
                                                label={stat.sub}
                                                size="small"
                                                color={allCompleted ? "success" : "warning"}
                                                className="!h-6 !text-[10px] font-medium"
                                            />
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Zoom>
                    </Grid>
                ))}
            </Grid> */}

			{/* ============ PREMIUM COMPLETION BANNER ============ */}
			{allCompleted && (
				<Zoom in timeout={600}>
					<Card className="!rounded-3xl !shadow-lg !border-0 my-6 overflow-hidden bg-white">
						{/* <Box className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5" /> */}
						<CardContent className="!p-8 text-center relative">
							<Box className="flex flex-col items-center gap-2">
								<Box className="relative">
									<Box className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
										<TrophyIcon className="!w-10 !h-10 text-green-600" />
									</Box>
									<Box className="absolute -top-2 -right-2">
										<StarIcon
											className="!w-6 !h-6 text-yellow-400 animate-spin"
											style={{ animationDuration: "3s" }}
										/>
									</Box>
								</Box>
								<Typography
									variant="h4"
									className="font-bold text-green-800 mt-4"
								>
									🎉 Congratulations, {onboarding.employeeName}!
								</Typography>
								<Typography
									variant="body1"
									className="text-green-600 max-w-2xl mt-2"
								>
									You have successfully completed all onboarding tasks. Your
									onboarding journey is now complete! You're all set to start
									your journey with us.
								</Typography>
								<Box className="flex flex-wrap gap-3 mt-6 justify-center">
									<Button
										variant="contained"
										color="success"
										startIcon={<TrophyIcon />}
										onClick={handleCompleteOnboarding}
										size="large"
										className="!bg-green-600 !normal-case !rounded-full !px-8 !shadow-lg !shadow-green-600/30 hover:!shadow-xl"
									>
										Complete Onboarding
									</Button>
									<Button
										variant="outlined"
										color="primary"
										startIcon={<DownloadIcon />}
										onClick={handleDownloadCertificate}
										className="!normal-case !rounded-full !px-8 !border-2"
									>
										Download Certificate
									</Button>
								</Box>
							</Box>
						</CardContent>
					</Card>
				</Zoom>
			)}

			{/* ============ WIZARD-STYLE ONBOARDING CHECKLIST ============ */}
			{!allCompleted && (
				<Box className="mb-6">
					<Box className="flex items-center justify-between mb-4 mx-4">
						<Box>
							<Typography variant="h6" className="font-bold text-gray-800">
								Your Onboarding Journey
							</Typography>
							<Typography variant="caption" className="text-gray-400">
								Complete each step to progress through your onboarding
							</Typography>
						</Box>
						<Box className="flex items-center gap-2">
							<Chip
								label={`${onboarding.overallProgressPercent}% Complete`}
								color="primary"
								className="!h-8 !rounded-full !font-medium"
							/>
						</Box>
					</Box>

					{/* ============ WIZARD STEPS ============ */}
					<Box className="space-y-3">
						{onboarding.checklists.map((checklist, idx) => {
							const checklistId = checklist.checklistId || checklist.id;
							const isActive = expandedChecklist === checklistId;
							const isCompleted = checklist.progressPercent === 100;
							const stepNumber = idx + 1;

							return (
								<Fade in timeout={400 + idx * 150} key={checklistId}>
									<Card
										className={`!rounded-xl !shadow-sm !bg-white-50 !border transition-all duration-300 overflow-hidden ${isActive
											? "!border-primary/40 !shadow-md ring-2 ring-primary"
											: isCompleted
												? "!border-green-500 !bg-green-50/20"
												: "!border-gray-200 hover:!border-gray-300"
											}`}
									>
										{/* ============ STEP HEADER ============ */}
										<Box
											className={`flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 ${isActive
												? "bg-gradient-to-r from-primary/5 to-primary/10"
												: ""
												}`}
											onClick={() => handleToggleChecklist(checklistId)}
										>
											{/* Step Number Badge */}
											<Box className="flex-shrink-0">
												<Box
													className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isCompleted
														? "bg-green-500 text-white shadow-lg shadow-green-200"
														: isActive
															? "bg-primary text-white shadow-lg shadow-primary/30"
															: "bg-gray-100 text-gray-500"
														}`}
												>
													{isCompleted ? (
														<CheckCircleIcon className="!w-5 !h-5" />
													) : (
														stepNumber
													)}
												</Box>
												{/* Connecting Line */}
												{idx < onboarding.checklists.length - 1 && (
													<Box className="w-0.5 h-6 bg-gray-200 mx-auto mt-1" />
												)}
											</Box>

											{/* Step Info */}
											<Box className="flex-1 min-w-0">
												<Box className="flex items-center gap-2 flex-wrap">
													<Typography
														variant="subtitle1"
														className="font-semibold text-gray-800"
													>
														Step {stepNumber}: {checklist.checklistName}
													</Typography>
													{isCompleted && (
														<Chip
															icon={<VerifiedIcon className="!w-4" />}
															label="Complete"
															size="small"
															color="success"
															className="!h-5 !text-[9px] !rounded-full"
														/>
													)}
												</Box>
												<Box className="flex items-center gap-3 mt-0.5 flex-wrap">
													<Typography
														variant="caption"
														className="text-gray-500"
													>
														{checklist.completedTasks}/{checklist.totalTasks}{" "}
														tasks
													</Typography>
													<Chip
														label={`${checklist.progressPercent}%`}
														size="small"
														className={`!h-5 !text-[9px] !rounded-full ${isCompleted
															? "!bg-green-100 !text-green-700"
															: "!bg-primary-50 !text-primary"
															}`}
													/>
													<Chip
														label={getStatusDisplay(checklist.status)}
														size="small"
														color={getStatusColor(checklist.status)}
														variant="outlined"
														className="!h-5 !text-[9px] !rounded-full"
													/>
												</Box>
											</Box>

											{/* Progress & Expand Toggle */}
											<Box className="flex items-center gap-3 flex-shrink-0">
												<Box className="min-w-[80px] hidden sm:block">
													<LinearProgress
														variant="determinate"
														value={checklist.progressPercent}
														className="h-1.5 rounded-full"
														sx={{
															backgroundColor: "#e5e7eb",
															"& .MuiLinearProgress-bar": {
																backgroundColor: isCompleted
																	? "#22c55e"
																	: checklist.progressPercent >= 70
																		? "#3b82f6"
																		: checklist.progressPercent >= 40
																			? "#f59e0b"
																			: "#ef4444",
																borderRadius: "999px",
															},
														}}
													/>
												</Box>
												<Box
													className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
														? "bg-primary-50 text-primary"
														: "bg-gray-100 text-gray-500"
														}`}
												>
													{isActive ? (
														<KeyboardArrowUp className="!w-5 !h-5" />
													) : (
														<KeyboardArrowDownIcon className="!w-5 !h-5" />
													)}
												</Box>
											</Box>
										</Box>

										{/* ============ STEP CONTENT ============ */}
										<Collapse in={isActive} timeout="auto" unmountOnExit>
											<Box className="p-4 pt-2">
												{/* Step Info Alert */}
												{/* <Box className="mb-3 flex items-center gap-2 text-sm text-gray-500 bg-white rounded-xl px-3 py-2 border border-gray-200">
                        <InfoOutlined className="!w-4 !h-4 text-primary" />
                        <Typography variant="caption">
                          {isCompleted
                            ? `✅ Step ${stepNumber} completed!`
                            : `Complete all ${checklist.totalTasks} tasks in this step to move forward`}
                        </Typography>
                      </Box> */}

												{/* ============ TASKS LIST ============ */}
												<Box className="space-y-2">
													{checklist.tasks?.map(
														(task: any, taskIdx: number) => {
															const isHovered = hoveredTask === task.id;
															const isTaskCompleted =
																task.status === "COMPLETED";
															const isTaskInProgress =
																task.status === "IN_PROGRESS";
															const isTaskOverdue = task.status === "OVERDUE";

															return (
																<Paper
																	key={task.taskInstanceId || task.id}
																	onMouseEnter={() => setHoveredTask(task.id)}
																	onMouseLeave={() => setHoveredTask(null)}
																	className={`!rounded-xl transition-all duration-200 ${isTaskCompleted
																		? "!bg-green-50/40 !border-green-200"
																		: isTaskOverdue
																			? "!bg-red-50/60 !border-red-200"
																			: isTaskInProgress
																				? "!bg-blue-50/60 !border-blue-200"
																				: "bg-gray-200 !border-gray-200"
																		} ${isHovered ? "!shadow-md !border-primary/30" : "!shadow-sm"}`}
																	elevation={0}
																	variant="outlined"
																>
																	<Box className="p-3">
																		<div className="flex items-center justify-between">
																			{/* Task Info */}
																			<Grid size={{ xs: 12, sm: 6, md: 7 }}>
																				<Box className="flex items-start gap-3">
																					{/* Task Status Icon */}
																					<Box className="mt-0.5 flex-shrink-0">
																						{isTaskCompleted ? (
																							<Box className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center shadow-sm shadow-green-200">
																								<CheckCircleIcon className="!w-4 !h-4 text-white" />
																							</Box>
																						) : isTaskOverdue ? (
																							<Box className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-sm shadow-red-200">
																								<WarningIcon className="!w-4 !h-4 text-white" />
																							</Box>
																						) : isTaskInProgress ? (
																							<Box className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-sm shadow-blue-200">
																								<ScheduleIcon className="!w-4 !h-4 text-white" />
																							</Box>
																						) : (
																							<Box className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-50">
																								<Typography
																									variant="caption"
																									className="text-gray-400 font-medium text-[10px]"
																								>
																									{taskIdx + 1}
																								</Typography>
																							</Box>
																						)}
																					</Box>

																					{/* Task Details */}
																					<Box className="flex-1 min-w-0">
																						<Typography
																							variant="body2"
																							className={`font-medium ${isTaskCompleted ? "text-gray-500 line-through" : "text-gray-800"}`}
																						>
																							{task.title || task.taskName}
																							{task.required && (
																								<Chip
																									label="Required"
																									size="small"
																									color="error"
																									className="ml-1.5 !h-4 !text-[8px] !rounded-full"
																								/>
																							)}
																						</Typography>

																						{task.description && (
																							<Typography
																								variant="caption"
																								className="text-gray-500 block mt-0.5 line-clamp-1"
																							>
																								{task.description}
																							</Typography>
																						)}

																						<Box className="flex gap-1 mt-1 flex-wrap">
																							<Chip
																								label={
																									task.taskType || "CUSTOM"
																								}
																								size="small"
																								variant="outlined"
																								color="primary"
																								className="!h-5 !text-[8px] !rounded-full"
																							/>
																							{task.documentName && (
																								<Chip
																									icon={
																										<AttachFileIcon className="!w-3 !h-3 !text-gray-800" />
																									}
																									label={task.documentName}
																									size="small"
																									variant="outlined"
																									className="!h-5 !text-[8px] text-gray-800 !rounded-full text-blue-600 border-blue-200"
																								/>
																							)}
																						</Box>
																					</Box>
																				</Box>
																			</Grid>

																			{/* Actions */}
																			<Grid size={{ xs: 12, sm: 6, md: 5 }}>
																				<Box className="flex items-center justify-end gap-2 flex-wrap">
																					{task.fileUrl && (
																						<Tooltip title="Download">
																							<IconButton
																								size="small"
																								href={task.fileUrl}
																								target="_blank"
																								component="a"
																								className="text-blue-600 hover:bg-blue-50 !w-7 !h-7"
																							>
																								<DownloadIcon className="!w-4 text-blue-500" />
																							</IconButton>
																						</Tooltip>
																					)}
																					{/* Status Chip */}
																					<Chip
																						label={getStatusDisplay(
																							task.status,
																						)}
																						size="small"
																						color={getStatusColor(task.status)}
																						variant={
																							isTaskCompleted
																								? "filled"
																								: "outlined"
																						}
																						className="!h-6 !text-[10px] !rounded-full !font-medium flex-shrink-0"
																					/>

																					{!isTaskCompleted ? (
																						<Box className="flex !gap-2">
																							{task.taskType === "DOCUMENT" ? (
																								<Tooltip title="Upload Document">
																									<Button
																										size="small"
																										variant="outlined"
																										onClick={() =>
																											handleUploadDocument(task)
																										}
																										className="!text-[10px] !px-4"
																										startIcon={
																											<UploadOutlined className="!w-4" />
																										}
																									>
																										Upload
																									</Button>
																								</Tooltip>
																							) : (
																								<Tooltip title="Mark as Complete">
																									<Button
																										size="small"
																										variant="outlined"
																										// color="info"
																										onClick={() =>
																											handleCompleteTask(task)
																										}
																										className="!text-[10px]"
																										disabled={isCompleting}
																										startIcon={
																											<CheckCircleOutlined className="!w-4" />
																										}
																									>
																										Complete
																									</Button>
																								</Tooltip>
																							)}

																						</Box>
																					) : (
																						<Box className="flex items-center gap-1">
																							{task.completedAt && (
																								<Typography
																									variant="caption"
																									className="text-gray-800 text-[10px] flex items-center gap-0.5"
																								>
																									{/* ✅{" "} */}
																									{/* {dayjs(
																										task.completedAt,
																									).format("DD MMM YYYY hh:mm:ss")} */}
																									{ formatDateTime(task.completedAt)}
																								</Typography>
																							)}
																							{/* {task.fileUrl && (
																								<Tooltip title="Download">
																									<IconButton
																										size="small"
																										href={task.fileUrl}
																										target="_blank"
																										component="a"
																										className="text-blue-600 hover:bg-blue-50 !w-7 !h-7"
																									>
																										<DownloadIcon className="!w-4 text-sky-500" />
																									</IconButton>
																								</Tooltip>
																							)} */}
																						</Box>
																					)}
																				</Box>
																			</Grid>
																		</div>
																	</Box>
																</Paper>
															);
														},
													)}

													{/* Empty State */}
													{(!checklist.tasks ||
														checklist.tasks.length === 0) && (
															<Box className="text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">
																<DescriptionIcon className="text-gray-300 !w-10 !h-10 mb-2" />
																<Typography
																	variant="body2"
																	className="text-gray-400"
																>
																	No tasks in this step
																</Typography>
															</Box>
														)}
												</Box>

												{/* Step Completion Status */}
												{isCompleted && (
													<Box className="mt-3 flex items-center gap-2 bg-green-50 rounded-xl px-4 py-2.5 border border-green-200">
														<Box className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center shadow-sm shadow-green-200 flex-shrink-0">
															<CheckCircleIcon className="!w-4 !h-4 text-white" />
														</Box>
														<Box>
															<Typography
																variant="caption"
																className="text-green-700 font-medium"
															>
																Step {stepNumber} completed! 🎉
															</Typography>
															<Typography
																variant="caption"
																className="text-green-600 block text-[10px]"
															>
																All tasks in this step are done
															</Typography>
														</Box>
													</Box>
												)}
											</Box>
										</Collapse>
									</Card>
								</Fade>
							);
						})}
					</Box>
				</Box>
			)}

			{/* ============ COMPLETE TASK DIALOG ============ */}
			<Dialog
				open={isCompleteDialogOpen}
				onClose={() => setIsCompleteDialogOpen(false)}
				maxWidth="sm"
				fullWidth
			// PaperProps={{ className: "!rounded-3xl" }}
			// TransitionComponent={Zoom}
			>
				<DialogTitle className="flex justify-between items-center !border-b !border-gray-200">
					<Box>
						<Typography variant="h6" className="font-bold text-gray-800">
							Complete Task
						</Typography>
						<Typography variant="caption" className="text-gray-400">
							Mark this task as completed
						</Typography>
					</Box>
					<IconButton
						onClick={() => setIsCompleteDialogOpen(false)}
						className="hover:bg-gray-100"
					>
						<CloseIcon className="text-gray-800" />
					</IconButton>
				</DialogTitle>
				<DialogContent className="!pt-6 !px-6">
					<Box className="space-y-6">
						<Alert
							severity="info"
							className="!rounded-xl !border !border-blue-200 !bg-blue-50"
						>
							<Typography variant="body2">
								Are you sure you want to mark{" "}
								<strong className="text-primary">
									{selectedTask?.title || selectedTask?.taskName}
								</strong>{" "}
								as completed?
							</Typography>
						</Alert>
						<TextField
							fullWidth
							multiline
							rows={3}
							label="Notes (Optional)"
							value={taskNotes}
							onChange={(e) => setTaskNotes(e.target.value)}
							placeholder="Add any notes about completing this task..."
						/>
					</Box>
				</DialogContent>
				<DialogActions className="border-t border-gray-200 !p-5">
					<Button
						onClick={() => setIsCompleteDialogOpen(false)}
						variant="outlined"
						className="!text-gray-800 !border-gray-200"
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmComplete}
						variant="contained"
						color="primary"
						disabled={isCompleting}
						className="!bg-primary"
					>
						{isCompleting ? <CircularProgress size={24} /> : "Mark as Complete"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* ============ UPLOAD DOCUMENT DIALOG ============ */}
			<Dialog
				open={isUploadDialogOpen}
				onClose={() => setIsUploadDialogOpen(false)}
				maxWidth="sm"
				fullWidth
			// PaperProps={{ className: "!rounded-3xl" }}
			// TransitionComponent={Zoom}
			>
				<DialogTitle className="flex justify-between items-center !border-b !border-gray-200">
					<Box>
						<Typography variant="h6" className="font-bold text-gray-800">
							Upload Document
						</Typography>
						<Typography variant="caption" className="text-gray-400">
							Upload required document for this task
						</Typography>
					</Box>
					<IconButton
						onClick={() => setIsUploadDialogOpen(false)}
						className="hover:bg-gray-100"
					>
						<CloseIcon className="text-gray-800" />
					</IconButton>
				</DialogTitle>
				<DialogContent className="!pt-6 !px-6">
					<Box>
						<Typography variant="body2" className="text-gray-600 !mb-4">
							Upload document for:{" "}
							<strong className="text-primary">
								{selectedTask?.title || selectedTask?.taskName}
							</strong>
						</Typography>

						<input
							accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.txt"
							style={{ display: "none" }}
							id="employee-document-upload"
							type="file"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) {
									if (file.size > 5 * 1024 * 1024) {
										showSnackbar("File size should be less than 5MB", "error");
										return;
									}
									setSelectedFile(file);
								}
							}}
						/>
						<label htmlFor="employee-document-upload">
							<Button
								variant="outlined"
								component="span"
								fullWidth
								startIcon={
									selectedFile ? <CheckCircleIcon /> : <DescriptionIcon />
								}
								className={`py-5 border-2 border-dashed !rounded-2xl transition-all ${selectedFile
									? "border-green-700 bg-green-50 text-green-700"
									: "border-gray-300 hover:border-primary hover:bg-primary/5"
									}`}
							>
								{selectedFile ? (
									<span className="font-medium">{selectedFile.name}</span>
								) : (
									"Choose File (Max 5MB)"
								)}
							</Button>
						</label>

						{selectedFile && (
							<Button
								size="small"
								color="error"
								onClick={() => setSelectedFile(null)}
								className="!normal-case !text-red-500"
								startIcon={<CloseIcon className="!w-4 !h-4" />}
							>
								Remove File
							</Button>
						)}

						{uploadProgress > 0 && uploadProgress < 100 && (
							<Box>
								<Typography variant="caption" className="text-gray-500">
									Uploading... {uploadProgress}%
								</Typography>
								<LinearProgress
									variant="determinate"
									value={uploadProgress}
									className="h-1.5 rounded-full mt-1"
								/>
							</Box>
						)}
					</Box>
				</DialogContent>
				<DialogActions className="border-t border-gray-200">
					<Button
						onClick={() => setIsUploadDialogOpen(false)}
						variant="outlined"
						className="!text-gray-800 !border-gray-200"
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmUpload}
						variant="contained"
						color="primary"
						disabled={!selectedFile}
						className="!bg-primary"
					>
						Upload
					</Button>
				</DialogActions>
			</Dialog>

			{/* ============ COMPLETION CELEBRATION DIALOG ============ */}
			<Dialog
				open={showCompletionDialog}
				onClose={() => setShowCompletionDialog(false)}
				maxWidth="sm"
				fullWidth
			// PaperProps={{ className: "!rounded-3xl" }}
			// TransitionComponent={Zoom}
			>
				<DialogTitle className="text-center !pt-8">
					<Box className="flex flex-col items-center">
						<Box className="relative">
							<Box className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
								<TrophyIcon className="!w-12 !h-12 text-white" />
							</Box>
							<Box className="absolute -top-2 -right-2">
								<StarIcon
									className="!w-6 !h-6 text-yellow-400 animate-spin"
									style={{ animationDuration: "2s" }}
								/>
							</Box>
						</Box>
						<Typography variant="h4" className="font-bold text-green-600 mt-4">
							🎉 Congratulations!
						</Typography>
					</Box>
				</DialogTitle>
				<DialogContent>
					<Box className="text-center py-2">
						<Typography variant="h6" className="text-gray-800 font-bold">
							You've Completed All Onboarding Tasks!
						</Typography>
						<Typography
							variant="body2"
							className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed"
						>
							You have successfully completed all your onboarding tasks. Click
							the button below to finalize your onboarding process and start
							your journey.
						</Typography>
					</Box>
				</DialogContent>
				<DialogActions className="border-t border-gray-200 !p-5 flex flex-col sm:flex-row gap-2 justify-center">
					<Button
						variant="contained"
						color="success"
						startIcon={<TrophyIcon />}
						onClick={handleCompleteOnboarding}
						size="large"
						className="!bg-green-600 !normal-case !rounded-full !px-8 !shadow-lg !shadow-green-600/30"
					>
						Complete Onboarding
					</Button>
					<Button
						onClick={() => setShowCompletionDialog(false)}
						variant="outlined"
						className="!normal-case !rounded-full !px-6"
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};
